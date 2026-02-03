/**
 * ProduFlow - Calculadora de BOM
 * Funções para cálculo recursivo de materiais e custos
 */

const db = require('../config/database');

/**
 * Calcula todos os materiais necessários para um produto
 * Resolve sub-produtos recursivamente e aplica tolerâncias
 * @param {number} produto_id - ID do produto
 * @param {number} quantidade - Quantidade a produzir
 * @param {Set} visitados - Set para detectar ciclos (uso interno)
 * @returns {Array} Lista de materiais com quantidades totais
 */
async function calcularMateriaisBOM(produto_id, quantidade = 1, visitados = new Set()) {
    // Verificar ciclo
    if (visitados.has(produto_id)) {
        console.warn(`Ciclo detectado no produto ${produto_id}`);
        return [];
    }
    visitados.add(produto_id);

    const materiaisMap = new Map();

    // Buscar BOM do produto
    const [bomLinhas] = await db.query(`
        SELECT b.*,
               m.nome AS material_nome,
               m.codigo AS material_codigo,
               m.unidade AS material_unidade,
               m.preco_unitario AS material_preco,
               m.stock_minimo,
               COALESCE(s.quantidade, 0) AS stock_atual
        FROM bom_linhas b
        LEFT JOIN materias_primas m ON b.material_id = m.id
        LEFT JOIN stock s ON m.id = s.materia_id
        WHERE b.produto_id = ?
    `, [produto_id]);

    for (const linha of bomLinhas) {
        // Calcular quantidade com tolerância
        const toleranciaFactor = 1 + (linha.tolerancia || 0) / 100;
        const quantidadeLinha = linha.quantidade * quantidade * toleranciaFactor;

        if (linha.tipo === 'material') {
            // Material direto
            const key = linha.material_id;
            if (materiaisMap.has(key)) {
                const existing = materiaisMap.get(key);
                existing.quantidade_total += quantidadeLinha;
            } else {
                materiaisMap.set(key, {
                    material_id: linha.material_id,
                    nome: linha.material_nome,
                    codigo: linha.material_codigo,
                    unidade: linha.material_unidade,
                    preco_unitario: linha.material_preco || 0,
                    stock_minimo: linha.stock_minimo || 0,
                    stock_atual: linha.stock_atual || 0,
                    quantidade_total: quantidadeLinha
                });
            }
        } else if (linha.tipo === 'subproduto') {
            // Sub-produto - resolver recursivamente
            const subMateriais = await calcularMateriaisBOM(
                linha.subproduto_id,
                linha.quantidade * quantidade,
                new Set(visitados)
            );

            for (const subMat of subMateriais) {
                const key = subMat.material_id;
                // Aplicar tolerância do sub-produto
                const subQty = subMat.quantidade_total * toleranciaFactor;

                if (materiaisMap.has(key)) {
                    const existing = materiaisMap.get(key);
                    existing.quantidade_total += subQty;
                } else {
                    materiaisMap.set(key, {
                        ...subMat,
                        quantidade_total: subQty
                    });
                }
            }
        }
        // servico_externo não adiciona materiais
    }

    return Array.from(materiaisMap.values());
}

/**
 * Calcula o custo total de um produto baseado no BOM
 * @param {number} produto_id - ID do produto
 * @param {number} quantidade - Quantidade
 * @returns {Object} Custo detalhado (materiais, serviços, total)
 */
async function calcularCustoBOM(produto_id, quantidade = 1) {
    // Calcular custo de materiais
    const materiais = await calcularMateriaisBOM(produto_id, quantidade);
    let custoMateriais = 0;

    for (const mat of materiais) {
        custoMateriais += mat.quantidade_total * mat.preco_unitario;
    }

    // Calcular custo de serviços
    const [servicos] = await db.query(`
        SELECT b.quantidade, s.preco_estimado
        FROM bom_linhas b
        JOIN servicos_externos s ON b.servico_id = s.id
        WHERE b.produto_id = ? AND b.tipo = 'servico_externo'
    `, [produto_id]);

    let custoServicos = 0;
    for (const serv of servicos) {
        custoServicos += serv.quantidade * quantidade * (serv.preco_estimado || 0);
    }

    return {
        materiais: Math.round(custoMateriais * 100) / 100,
        servicos: Math.round(custoServicos * 100) / 100,
        total: Math.round((custoMateriais + custoServicos) * 100) / 100,
        detalhes_materiais: materiais.map(m => ({
            nome: m.nome,
            quantidade: m.quantidade_total,
            custo: Math.round(m.quantidade_total * m.preco_unitario * 100) / 100
        }))
    };
}

/**
 * Verifica se adicionar um sub-produto criaria um ciclo
 * @param {number} produto_id - ID do produto pai
 * @param {number} subproduto_id - ID do potencial sub-produto
 * @returns {boolean} True se criaria ciclo
 */
async function verificarCiclo(produto_id, subproduto_id) {
    const visitados = new Set();

    async function verificar(id) {
        if (visitados.has(id)) return false;
        if (id === produto_id) return true;

        visitados.add(id);

        const [subprodutos] = await db.query(
            `SELECT subproduto_id FROM bom_linhas
             WHERE produto_id = ? AND tipo = 'subproduto'`,
            [id]
        );

        for (const sub of subprodutos) {
            if (await verificar(sub.subproduto_id)) {
                return true;
            }
        }

        return false;
    }

    return await verificar(subproduto_id);
}

/**
 * Obtém BOM hierárquica (para visualização em árvore)
 * @param {number} produto_id - ID do produto
 * @param {number} nivel - Nível de profundidade (uso interno)
 * @returns {Object} BOM estruturada hierarquicamente
 */
async function obterBOMHierarquica(produto_id, nivel = 0) {
    if (nivel > 10) {
        return { error: 'Profundidade máxima excedida' };
    }

    const [produto] = await db.query(
        'SELECT id, nome, sku FROM produtos WHERE id = ?',
        [produto_id]
    );

    if (produto.length === 0) {
        return null;
    }

    const [bomLinhas] = await db.query(`
        SELECT b.*,
               m.nome AS material_nome,
               m.codigo AS material_codigo,
               m.unidade AS material_unidade,
               p.nome AS subproduto_nome,
               p.sku AS subproduto_sku,
               s.nome AS servico_nome
        FROM bom_linhas b
        LEFT JOIN materias_primas m ON b.material_id = m.id
        LEFT JOIN produtos p ON b.subproduto_id = p.id
        LEFT JOIN servicos_externos s ON b.servico_id = s.id
        WHERE b.produto_id = ?
        ORDER BY b.tipo, b.id
    `, [produto_id]);

    const linhas = [];

    for (const linha of bomLinhas) {
        const item = {
            id: linha.id,
            tipo: linha.tipo,
            quantidade: linha.quantidade,
            unidade: linha.unidade,
            tolerancia: linha.tolerancia,
            notas: linha.notas
        };

        if (linha.tipo === 'material') {
            item.nome = linha.material_nome;
            item.codigo = linha.material_codigo;
        } else if (linha.tipo === 'subproduto') {
            item.nome = linha.subproduto_nome;
            item.codigo = linha.subproduto_sku;
            // Resolver recursivamente
            item.bom = await obterBOMHierarquica(linha.subproduto_id, nivel + 1);
        } else if (linha.tipo === 'servico_externo') {
            item.nome = linha.servico_nome;
        }

        linhas.push(item);
    }

    return {
        produto_id: produto[0].id,
        nome: produto[0].nome,
        sku: produto[0].sku,
        nivel: nivel,
        linhas: linhas
    };
}

module.exports = {
    calcularMateriaisBOM,
    calcularCustoBOM,
    verificarCiclo,
    obterBOMHierarquica
};
