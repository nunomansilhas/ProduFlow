/**
 * ProduFlow - Controller de BOM (Bill of Materials)
 */

const db = require('../config/database');
const bomCalculator = require('../utils/bomCalculator');

// Listar BOM de um produto
exports.listar = async (req, res) => {
    try {
        const { produto_id } = req.params;
        const { tipo } = req.query;

        let query = `
            SELECT b.*,
                   m.nome AS material_nome,
                   m.codigo AS material_codigo,
                   m.unidade AS material_unidade,
                   m.preco_unitario AS material_preco,
                   p.nome AS subproduto_nome,
                   p.sku AS subproduto_sku,
                   s.nome AS servico_nome,
                   s.preco_estimado AS servico_preco,
                   f.nome AS fornecedor_nome
            FROM bom_linhas b
            LEFT JOIN materias_primas m ON b.material_id = m.id
            LEFT JOIN produtos p ON b.subproduto_id = p.id
            LEFT JOIN servicos_externos s ON b.servico_id = s.id
            LEFT JOIN fornecedores f ON s.fornecedor_id = f.id
            WHERE b.produto_id = ?
        `;
        const params = [produto_id];

        // Filtrar por tipo se especificado
        if (tipo) {
            query += ' AND b.tipo = ?';
            params.push(tipo);
        }

        query += ' ORDER BY b.tipo, b.id';

        const [rows] = await db.query(query, params);

        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar BOM:', error);
        res.status(500).json({ error: 'Erro ao listar BOM' });
    }
};

// Obter linha de BOM por ID
exports.obter = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT b.*,
                   m.nome AS material_nome,
                   p.nome AS subproduto_nome,
                   s.nome AS servico_nome
            FROM bom_linhas b
            LEFT JOIN materias_primas m ON b.material_id = m.id
            LEFT JOIN produtos p ON b.subproduto_id = p.id
            LEFT JOIN servicos_externos s ON b.servico_id = s.id
            WHERE b.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Linha de BOM não encontrada' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao obter linha de BOM:', error);
        res.status(500).json({ error: 'Erro ao obter linha de BOM' });
    }
};

// Criar linha de BOM
exports.criar = async (req, res) => {
    try {
        const { produto_id, tipo, material_id, subproduto_id, servico_id, quantidade, unidade, tolerancia, notas } = req.body;

        if (!produto_id || !tipo || quantidade === undefined) {
            return res.status(400).json({ error: 'produto_id, tipo e quantidade são obrigatórios' });
        }

        if (!['material', 'subproduto', 'servico_externo'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo inválido' });
        }

        // Validar campos conforme tipo
        if (tipo === 'material' && !material_id) {
            return res.status(400).json({ error: 'material_id é obrigatório para tipo material' });
        }
        if (tipo === 'subproduto' && !subproduto_id) {
            return res.status(400).json({ error: 'subproduto_id é obrigatório para tipo subproduto' });
        }
        if (tipo === 'servico_externo' && !servico_id) {
            return res.status(400).json({ error: 'servico_id é obrigatório para tipo servico_externo' });
        }

        // Verificar ciclo recursivo em sub-produtos
        if (tipo === 'subproduto') {
            if (subproduto_id == produto_id) {
                return res.status(400).json({ error: 'Um produto não pode ser sub-produto de si mesmo' });
            }

            // Verificar se o sub-produto não usa este produto na sua BOM (ciclo)
            const hasCycle = await bomCalculator.verificarCiclo(produto_id, subproduto_id);
            if (hasCycle) {
                return res.status(400).json({ error: 'Este sub-produto criaria uma referência circular' });
            }
        }

        const [result] = await db.query(
            `INSERT INTO bom_linhas
             (produto_id, tipo, material_id, subproduto_id, servico_id, quantidade, unidade, tolerancia, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                produto_id,
                tipo,
                tipo === 'material' ? material_id : null,
                tipo === 'subproduto' ? subproduto_id : null,
                tipo === 'servico_externo' ? servico_id : null,
                quantidade,
                unidade || null,
                tolerancia || 0,
                notas || null
            ]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Linha de BOM criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar linha de BOM:', error);
        res.status(500).json({ error: 'Erro ao criar linha de BOM' });
    }
};

// Atualizar linha de BOM
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantidade, unidade, tolerancia, notas } = req.body;

        if (quantidade === undefined) {
            return res.status(400).json({ error: 'Quantidade é obrigatória' });
        }

        const [result] = await db.query(
            `UPDATE bom_linhas SET
                quantidade = ?, unidade = ?, tolerancia = ?, notas = ?
             WHERE id = ?`,
            [quantidade, unidade || null, tolerancia || 0, notas || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Linha de BOM não encontrada' });
        }

        res.json({ message: 'Linha de BOM atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar linha de BOM:', error);
        res.status(500).json({ error: 'Erro ao atualizar linha de BOM' });
    }
};

// Eliminar linha de BOM
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM bom_linhas WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Linha de BOM não encontrada' });
        }

        res.json({ message: 'Linha de BOM eliminada com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar linha de BOM:', error);
        res.status(500).json({ error: 'Erro ao eliminar linha de BOM' });
    }
};

// Calcular materiais totais (resolvendo sub-produtos recursivamente)
exports.calcularMateriais = async (req, res) => {
    try {
        const { produto_id } = req.params;
        const { quantidade = 1 } = req.query;

        const materiais = await bomCalculator.calcularMateriaisBOM(produto_id, parseFloat(quantidade));

        res.json(materiais);
    } catch (error) {
        console.error('Erro ao calcular materiais:', error);
        res.status(500).json({ error: 'Erro ao calcular materiais' });
    }
};

// Obter BOM completa (hierárquica)
exports.bomCompleta = async (req, res) => {
    try {
        const { produto_id } = req.params;

        const bom = await bomCalculator.obterBOMHierarquica(produto_id);

        res.json(bom);
    } catch (error) {
        console.error('Erro ao obter BOM completa:', error);
        res.status(500).json({ error: 'Erro ao obter BOM completa' });
    }
};
