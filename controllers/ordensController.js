/**
 * ProduFlow - Controller de Ordens de Produção
 */

const db = require('../config/database');
const bomCalculator = require('../utils/bomCalculator');

// Listar ordens
exports.listar = async (req, res) => {
    try {
        const { estado, prioridade, produto_id, limite = 100 } = req.query;

        let sql = `
            SELECT
                o.*,
                p.nome AS produto_nome,
                p.sku AS produto_sku,
                (SELECT e.nome FROM ordem_estacoes oe
                 JOIN estacoes e ON oe.estacao_id = e.id
                 WHERE oe.ordem_id = o.id AND oe.estado = 'em_progresso'
                 LIMIT 1) AS estacao_atual,
                (SELECT e.cor FROM ordem_estacoes oe
                 JOIN estacoes e ON oe.estacao_id = e.id
                 WHERE oe.ordem_id = o.id AND oe.estado = 'em_progresso'
                 LIMIT 1) AS estacao_cor,
                DATEDIFF(o.data_prevista, CURRENT_DATE) AS dias_para_entrega
            FROM ordens o
            JOIN produtos p ON o.produto_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (estado) {
            if (estado === 'ativas') {
                sql += ' AND o.estado IN ("pendente", "em_producao", "aguarda_externo")';
            } else {
                sql += ' AND o.estado = ?';
                params.push(estado);
            }
        }

        if (prioridade) {
            sql += ' AND o.prioridade = ?';
            params.push(prioridade);
        }

        if (produto_id) {
            sql += ' AND o.produto_id = ?';
            params.push(produto_id);
        }

        sql += ' ORDER BY o.prioridade DESC, o.data_prevista, o.created_at DESC';
        sql += ` LIMIT ${parseInt(limite)}`;

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar ordens:', error);
        res.status(500).json({ error: 'Erro ao listar ordens' });
    }
};

// Obter ordem por ID
exports.obter = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT o.*,
                   p.nome AS produto_nome,
                   p.sku AS produto_sku,
                   c.nome AS cliente_nome_db
            FROM ordens o
            JOIN produtos p ON o.produto_id = p.id
            LEFT JOIN clientes c ON o.cliente_id = c.id
            WHERE o.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ordem não encontrada' });
        }

        const ordem = rows[0];

        // Buscar estações da ordem
        const [estacoes] = await db.query(`
            SELECT oe.*, e.nome, e.cor, e.icone
            FROM ordem_estacoes oe
            JOIN estacoes e ON oe.estacao_id = e.id
            WHERE oe.ordem_id = ?
            ORDER BY oe.ordem
        `, [id]);

        // Buscar materiais da ordem
        const [materiais] = await db.query(`
            SELECT om.*,
                   m.nome, m.codigo, m.unidade,
                   COALESCE(s.quantidade, 0) AS stock_atual
            FROM ordem_materiais om
            JOIN materias_primas m ON om.material_id = m.id
            LEFT JOIN stock s ON m.id = s.materia_id
            WHERE om.ordem_id = ?
        `, [id]);

        // Buscar serviços da ordem
        const [servicos] = await db.query(`
            SELECT os.*, se.nome, f.nome AS fornecedor_nome
            FROM ordem_servicos os
            JOIN servicos_externos se ON os.servico_id = se.id
            LEFT JOIN fornecedores f ON se.fornecedor_id = f.id
            WHERE os.ordem_id = ?
        `, [id]);

        ordem.estacoes = estacoes;
        ordem.materiais = materiais;
        ordem.servicos = servicos;

        res.json(ordem);
    } catch (error) {
        console.error('Erro ao obter ordem:', error);
        res.status(500).json({ error: 'Erro ao obter ordem' });
    }
};

// Criar ordem
exports.criar = async (req, res) => {
    try {
        const { produto_id, quantidade, cliente_id, cliente_nome, data_prevista, prioridade, notas } = req.body;

        if (!produto_id || !quantidade) {
            return res.status(400).json({ error: 'produto_id e quantidade são obrigatórios' });
        }

        // Gerar número da ordem
        const [numResult] = await db.query('SELECT gerar_numero_ordem() AS numero');
        const numero = numResult[0].numero;

        // Criar ordem
        const [result] = await db.query(
            `INSERT INTO ordens
             (numero, produto_id, quantidade, cliente_id, cliente_nome, data_prevista, prioridade, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                numero,
                produto_id,
                quantidade,
                cliente_id || null,
                cliente_nome || null,
                data_prevista || null,
                prioridade || 2,
                notas || null
            ]
        );

        const ordem_id = result.insertId;

        // Criar registos de estações
        const [estacoes] = await db.query(`
            SELECT estacao_id, ordem FROM produto_estacoes
            WHERE produto_id = ?
            ORDER BY ordem
        `, [produto_id]);

        // Se não tiver estações configuradas, usar as default
        if (estacoes.length === 0) {
            const [defaultEstacoes] = await db.query(
                'SELECT id, ordem_default FROM estacoes WHERE ativa = TRUE ORDER BY ordem_default'
            );
            for (const est of defaultEstacoes) {
                await db.query(
                    `INSERT INTO ordem_estacoes (ordem_id, estacao_id, ordem) VALUES (?, ?, ?)`,
                    [ordem_id, est.id, est.ordem_default]
                );
            }
        } else {
            for (const est of estacoes) {
                await db.query(
                    `INSERT INTO ordem_estacoes (ordem_id, estacao_id, ordem) VALUES (?, ?, ?)`,
                    [ordem_id, est.estacao_id, est.ordem]
                );
            }
        }

        // Calcular e criar registos de materiais
        const materiais = await bomCalculator.calcularMateriaisBOM(produto_id, quantidade);
        const alertas = [];

        for (const mat of materiais) {
            await db.query(
                `INSERT INTO ordem_materiais (ordem_id, material_id, quantidade_necessaria)
                 VALUES (?, ?, ?)`,
                [ordem_id, mat.material_id, mat.quantidade_total]
            );

            // Verificar stock
            if (mat.stock_atual < mat.quantidade_total) {
                alertas.push({
                    tipo: 'material_insuficiente',
                    mensagem: `Material insuficiente para ${numero}: ${mat.nome} (necessário: ${mat.quantidade_total}, disponível: ${mat.stock_atual})`,
                    material_id: mat.material_id,
                    ordem_id: ordem_id
                });
            }
        }

        // Criar registos de serviços externos
        const [servicos] = await db.query(`
            SELECT DISTINCT servico_id FROM bom_linhas
            WHERE produto_id = ? AND tipo = 'servico_externo'
        `, [produto_id]);

        for (const serv of servicos) {
            await db.query(
                `INSERT INTO ordem_servicos (ordem_id, servico_id) VALUES (?, ?)`,
                [ordem_id, serv.servico_id]
            );
        }

        // Criar alertas
        for (const alerta of alertas) {
            await db.query(
                `INSERT INTO alertas (tipo, mensagem, ordem_id, material_id) VALUES (?, ?, ?, ?)`,
                [alerta.tipo, alerta.mensagem, alerta.ordem_id, alerta.material_id]
            );
        }

        res.status(201).json({
            id: ordem_id,
            numero: numero,
            alertas: alertas.length,
            message: 'Ordem criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar ordem:', error);
        res.status(500).json({ error: 'Erro ao criar ordem' });
    }
};

// Atualizar ordem
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { cliente_id, cliente_nome, data_prevista, prioridade, estado, notas } = req.body;

        const [result] = await db.query(
            `UPDATE ordens SET
                cliente_id = ?, cliente_nome = ?, data_prevista = ?,
                prioridade = ?, estado = ?, notas = ?
             WHERE id = ?`,
            [
                cliente_id || null,
                cliente_nome || null,
                data_prevista || null,
                prioridade || 2,
                estado || 'pendente',
                notas || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ordem não encontrada' });
        }

        res.json({ message: 'Ordem atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ordem:', error);
        res.status(500).json({ error: 'Erro ao atualizar ordem' });
    }
};

// Eliminar ordem
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se pode ser eliminada (só pendentes)
        const [ordem] = await db.query('SELECT estado FROM ordens WHERE id = ?', [id]);

        if (ordem.length === 0) {
            return res.status(404).json({ error: 'Ordem não encontrada' });
        }

        if (ordem[0].estado !== 'pendente') {
            return res.status(400).json({ error: 'Só é possível eliminar ordens pendentes' });
        }

        // Eliminar registos relacionados
        await db.query('DELETE FROM ordem_estacoes WHERE ordem_id = ?', [id]);
        await db.query('DELETE FROM ordem_materiais WHERE ordem_id = ?', [id]);
        await db.query('DELETE FROM ordem_servicos WHERE ordem_id = ?', [id]);
        await db.query('DELETE FROM alertas WHERE ordem_id = ?', [id]);
        await db.query('DELETE FROM ordens WHERE id = ?', [id]);

        res.json({ message: 'Ordem eliminada com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar ordem:', error);
        res.status(500).json({ error: 'Erro ao eliminar ordem' });
    }
};

// Iniciar produção (passar de pendente para em_producao)
exports.iniciarProducao = async (req, res) => {
    try {
        const { id } = req.params;

        // Atualizar estado da ordem
        await db.query(
            `UPDATE ordens SET estado = 'em_producao' WHERE id = ? AND estado = 'pendente'`,
            [id]
        );

        // Iniciar primeira estação
        await db.query(
            `UPDATE ordem_estacoes SET estado = 'em_progresso', iniciado_em = NOW()
             WHERE ordem_id = ? AND ordem = (SELECT MIN(ordem) FROM ordem_estacoes WHERE ordem_id = ?)`,
            [id, id]
        );

        res.json({ message: 'Produção iniciada' });
    } catch (error) {
        console.error('Erro ao iniciar produção:', error);
        res.status(500).json({ error: 'Erro ao iniciar produção' });
    }
};

// Avançar para próxima estação
exports.avancarEstacao = async (req, res) => {
    try {
        const { id } = req.params;
        const { estacao_id, notas } = req.body;

        // Concluir estação atual
        await db.query(
            `UPDATE ordem_estacoes SET
                estado = 'concluido',
                concluido_em = NOW(),
                notas = CONCAT(COALESCE(notas, ''), ?)
             WHERE ordem_id = ? AND estacao_id = ?`,
            [notas ? `\n${notas}` : '', id, estacao_id]
        );

        // Calcular tempo real (simplificado - em minutos)
        await db.query(`
            UPDATE ordem_estacoes SET
                tempo_real = TIMESTAMPDIFF(MINUTE, iniciado_em, concluido_em)
            WHERE ordem_id = ? AND estacao_id = ?
        `, [id, estacao_id]);

        // Verificar se há próxima estação
        const [proxima] = await db.query(`
            SELECT oe.estacao_id, oe.ordem
            FROM ordem_estacoes oe
            WHERE oe.ordem_id = ?
              AND oe.estado = 'pendente'
            ORDER BY oe.ordem
            LIMIT 1
        `, [id]);

        if (proxima.length > 0) {
            // Iniciar próxima estação
            await db.query(
                `UPDATE ordem_estacoes SET estado = 'em_progresso', iniciado_em = NOW()
                 WHERE ordem_id = ? AND estacao_id = ?`,
                [id, proxima[0].estacao_id]
            );

            res.json({
                message: 'Avançou para próxima estação',
                proxima_estacao: proxima[0].estacao_id
            });
        } else {
            // Verificar serviços externos pendentes
            const [servicos] = await db.query(
                `SELECT COUNT(*) as count FROM ordem_servicos
                 WHERE ordem_id = ? AND estado != 'recebido'`,
                [id]
            );

            if (servicos[0].count > 0) {
                await db.query(`UPDATE ordens SET estado = 'aguarda_externo' WHERE id = ?`, [id]);
                res.json({ message: 'Aguardando serviços externos', estado: 'aguarda_externo' });
            } else {
                // Concluir ordem e descontar stock
                await concluirOrdem(id);
                res.json({ message: 'Ordem concluída', estado: 'concluida' });
            }
        }
    } catch (error) {
        console.error('Erro ao avançar estação:', error);
        res.status(500).json({ error: 'Erro ao avançar estação' });
    }
};

// Saltar estação
exports.saltarEstacao = async (req, res) => {
    try {
        const { id } = req.params;
        const { estacao_id, motivo } = req.body;

        await db.query(
            `UPDATE ordem_estacoes SET estado = 'saltado', notas = ?
             WHERE ordem_id = ? AND estacao_id = ?`,
            [motivo || 'Saltado', id, estacao_id]
        );

        // Iniciar próxima estação
        const [proxima] = await db.query(`
            SELECT estacao_id FROM ordem_estacoes
            WHERE ordem_id = ? AND estado = 'pendente'
            ORDER BY ordem LIMIT 1
        `, [id]);

        if (proxima.length > 0) {
            await db.query(
                `UPDATE ordem_estacoes SET estado = 'em_progresso', iniciado_em = NOW()
                 WHERE ordem_id = ? AND estacao_id = ?`,
                [id, proxima[0].estacao_id]
            );
        }

        res.json({ message: 'Estação saltada' });
    } catch (error) {
        console.error('Erro ao saltar estação:', error);
        res.status(500).json({ error: 'Erro ao saltar estação' });
    }
};

// Verificar stock para ordem
exports.verificarStock = async (req, res) => {
    try {
        const { produto_id, quantidade } = req.query;

        if (!produto_id || !quantidade) {
            return res.status(400).json({ error: 'produto_id e quantidade são obrigatórios' });
        }

        const materiais = await bomCalculator.calcularMateriaisBOM(produto_id, parseFloat(quantidade));

        const resultado = materiais.map(mat => ({
            ...mat,
            estado: mat.stock_atual >= mat.quantidade_total ? 'ok' :
                    mat.stock_atual > 0 ? 'baixo' : 'insuficiente'
        }));

        res.json(resultado);
    } catch (error) {
        console.error('Erro ao verificar stock:', error);
        res.status(500).json({ error: 'Erro ao verificar stock' });
    }
};

// Função auxiliar para concluir ordem
async function concluirOrdem(ordem_id) {
    // Atualizar estado
    await db.query(`UPDATE ordens SET estado = 'concluida' WHERE id = ?`, [ordem_id]);

    // Descontar stock
    const [materiais] = await db.query(
        'SELECT material_id, quantidade_necessaria FROM ordem_materiais WHERE ordem_id = ?',
        [ordem_id]
    );

    for (const mat of materiais) {
        const [stock] = await db.query(
            'SELECT id FROM stock WHERE materia_id = ?',
            [mat.material_id]
        );

        if (stock.length > 0) {
            await db.query(
                `INSERT INTO stock_movimentos (stock_id, tipo, quantidade, ordem_id, motivo)
                 VALUES (?, 'saida', ?, ?, 'Consumo em produção')`,
                [stock[0].id, mat.quantidade_necessaria, ordem_id]
            );

            // Atualizar quantidade usada
            await db.query(
                `UPDATE ordem_materiais SET quantidade_usada = quantidade_necessaria
                 WHERE ordem_id = ? AND material_id = ?`,
                [ordem_id, mat.material_id]
            );
        }
    }
}
