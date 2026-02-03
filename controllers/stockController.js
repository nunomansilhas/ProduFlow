/**
 * ProduFlow - Controller de Stock
 */

const db = require('../config/database');

// Listar todo o stock
exports.listar = async (req, res) => {
    try {
        const { estado, categoria_id } = req.query;

        let sql = `
            SELECT
                m.id AS material_id,
                m.nome,
                m.codigo,
                m.unidade,
                m.stock_minimo,
                m.preco_unitario,
                m.localizacao,
                s.quantidade,
                s.id AS stock_id,
                CASE
                    WHEN s.quantidade < 0 THEN 'negativo'
                    WHEN s.quantidade < m.stock_minimo THEN 'baixo'
                    ELSE 'ok'
                END AS estado_stock,
                c.nome AS categoria_nome,
                f.nome AS fornecedor_nome
            FROM materias_primas m
            LEFT JOIN stock s ON m.id = s.materia_id
            LEFT JOIN categorias c ON m.categoria_id = c.id
            LEFT JOIN fornecedores f ON m.fornecedor_id = f.id
            WHERE m.ativo = TRUE
        `;
        const params = [];

        if (categoria_id) {
            sql += ' AND m.categoria_id = ?';
            params.push(categoria_id);
        }

        sql += ' ORDER BY m.nome';

        let [rows] = await db.query(sql, params);

        // Filtrar por estado se especificado
        if (estado) {
            rows = rows.filter(r => r.estado_stock === estado);
        }

        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar stock:', error);
        res.status(500).json({ error: 'Erro ao listar stock' });
    }
};

// Obter stock de uma matéria
exports.obter = async (req, res) => {
    try {
        const { materia_id } = req.params;

        const [rows] = await db.query(`
            SELECT
                m.*,
                s.quantidade,
                s.id AS stock_id,
                CASE
                    WHEN s.quantidade < 0 THEN 'negativo'
                    WHEN s.quantidade < m.stock_minimo THEN 'baixo'
                    ELSE 'ok'
                END AS estado_stock
            FROM materias_primas m
            LEFT JOIN stock s ON m.id = s.materia_id
            WHERE m.id = ?
        `, [materia_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Matéria-prima não encontrada' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao obter stock:', error);
        res.status(500).json({ error: 'Erro ao obter stock' });
    }
};

// Registar movimento de stock (entrada ou saída)
exports.movimento = async (req, res) => {
    try {
        const { materia_id, tipo, quantidade, motivo, ordem_id } = req.body;
        const user_id = req.session.user?.id;

        if (!materia_id || !tipo || quantidade === undefined) {
            return res.status(400).json({ error: 'materia_id, tipo e quantidade são obrigatórios' });
        }

        if (!['entrada', 'saida'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo deve ser "entrada" ou "saida"' });
        }

        const qty = parseFloat(quantidade);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ error: 'Quantidade deve ser um número positivo' });
        }

        // Obter stock_id
        const [stock] = await db.query(
            'SELECT id FROM stock WHERE materia_id = ?',
            [materia_id]
        );

        if (stock.length === 0) {
            return res.status(404).json({ error: 'Stock não encontrado para esta matéria' });
        }

        const stock_id = stock[0].id;

        // Criar movimento (o trigger atualiza a quantidade)
        await db.query(
            `INSERT INTO stock_movimentos (stock_id, tipo, quantidade, ordem_id, motivo, user_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [stock_id, tipo, qty, ordem_id || null, motivo || null, user_id]
        );

        // Verificar se precisa criar alerta
        await verificarAlertasStock(materia_id);

        res.json({ message: `Movimento de ${tipo} registado com sucesso` });
    } catch (error) {
        console.error('Erro ao registar movimento:', error);
        res.status(500).json({ error: 'Erro ao registar movimento' });
    }
};

// Ajuste de inventário (definir quantidade exata)
exports.ajuste = async (req, res) => {
    try {
        const { materia_id, quantidade, motivo } = req.body;
        const user_id = req.session.user?.id;

        if (!materia_id || quantidade === undefined) {
            return res.status(400).json({ error: 'materia_id e quantidade são obrigatórios' });
        }

        const qty = parseFloat(quantidade);
        if (isNaN(qty)) {
            return res.status(400).json({ error: 'Quantidade deve ser um número válido' });
        }

        // Obter stock_id
        const [stock] = await db.query(
            'SELECT id FROM stock WHERE materia_id = ?',
            [materia_id]
        );

        if (stock.length === 0) {
            return res.status(404).json({ error: 'Stock não encontrado para esta matéria' });
        }

        const stock_id = stock[0].id;

        // Criar movimento de ajuste (o trigger define a quantidade)
        await db.query(
            `INSERT INTO stock_movimentos (stock_id, tipo, quantidade, motivo, user_id)
             VALUES (?, 'ajuste', ?, ?, ?)`,
            [stock_id, qty, motivo || 'Acerto de inventário', user_id]
        );

        // Verificar alertas
        await verificarAlertasStock(materia_id);

        res.json({ message: 'Ajuste de inventário registado com sucesso' });
    } catch (error) {
        console.error('Erro ao ajustar inventário:', error);
        res.status(500).json({ error: 'Erro ao ajustar inventário' });
    }
};

// Listar movimentos de uma matéria
exports.movimentos = async (req, res) => {
    try {
        const { materia_id } = req.params;
        const { limite } = req.query;

        let sql = `
            SELECT sm.*,
                   u.nome AS user_nome,
                   o.numero AS ordem_numero
            FROM stock_movimentos sm
            JOIN stock s ON sm.stock_id = s.id
            LEFT JOIN users u ON sm.user_id = u.id
            LEFT JOIN ordens o ON sm.ordem_id = o.id
            WHERE s.materia_id = ?
            ORDER BY sm.created_at DESC
        `;

        if (limite) {
            sql += ` LIMIT ${parseInt(limite)}`;
        }

        const [rows] = await db.query(sql, [materia_id]);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar movimentos:', error);
        res.status(500).json({ error: 'Erro ao listar movimentos' });
    }
};

// Listar todos os movimentos recentes
exports.todosMovimentos = async (req, res) => {
    try {
        const { limite = 50 } = req.query;

        const [rows] = await db.query(`
            SELECT sm.*,
                   m.nome AS material_nome,
                   m.codigo AS material_codigo,
                   m.unidade,
                   u.nome AS user_nome,
                   o.numero AS ordem_numero
            FROM stock_movimentos sm
            JOIN stock s ON sm.stock_id = s.id
            JOIN materias_primas m ON s.materia_id = m.id
            LEFT JOIN users u ON sm.user_id = u.id
            LEFT JOIN ordens o ON sm.ordem_id = o.id
            ORDER BY sm.created_at DESC
            LIMIT ?
        `, [parseInt(limite)]);

        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar movimentos:', error);
        res.status(500).json({ error: 'Erro ao listar movimentos' });
    }
};

// Função auxiliar para verificar e criar alertas de stock
async function verificarAlertasStock(materia_id) {
    try {
        const [stock] = await db.query(`
            SELECT m.id, m.nome, m.stock_minimo, s.quantidade
            FROM materias_primas m
            JOIN stock s ON m.id = s.materia_id
            WHERE m.id = ?
        `, [materia_id]);

        if (stock.length === 0) return;

        const { quantidade, stock_minimo, nome } = stock[0];

        // Limpar alertas anteriores para esta matéria
        await db.query(
            'DELETE FROM alertas WHERE material_id = ? AND tipo IN ("stock_baixo", "stock_negativo")',
            [materia_id]
        );

        // Criar novos alertas se necessário
        if (quantidade < 0) {
            await db.query(
                `INSERT INTO alertas (tipo, mensagem, material_id)
                 VALUES ('stock_negativo', ?, ?)`,
                [`Stock negativo: ${nome} (${quantidade})`, materia_id]
            );
        } else if (quantidade < stock_minimo) {
            await db.query(
                `INSERT INTO alertas (tipo, mensagem, material_id)
                 VALUES ('stock_baixo', ?, ?)`,
                [`Stock baixo: ${nome} (${quantidade}, mínimo: ${stock_minimo})`, materia_id]
            );
        }
    } catch (error) {
        console.error('Erro ao verificar alertas:', error);
    }
}

module.exports.verificarAlertasStock = verificarAlertasStock;
