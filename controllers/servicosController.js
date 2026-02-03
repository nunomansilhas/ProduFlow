/**
 * ProduFlow - Controller de Serviços Externos
 */

const db = require('../config/database');

// Listar todos os serviços
exports.listar = async (req, res) => {
    try {
        const { ativo } = req.query;

        let sql = `
            SELECT s.*,
                   f.nome AS fornecedor_nome
            FROM servicos_externos s
            LEFT JOIN fornecedores f ON s.fornecedor_id = f.id
            WHERE 1=1
        `;
        const params = [];

        if (ativo !== undefined) {
            sql += ' AND s.ativo = ?';
            params.push(ativo === 'true' || ativo === '1');
        }

        sql += ' ORDER BY s.nome';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar serviços:', error);
        res.status(500).json({ error: 'Erro ao listar serviços' });
    }
};

// Obter serviço por ID
exports.obter = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT s.*,
                   f.nome AS fornecedor_nome
            FROM servicos_externos s
            LEFT JOIN fornecedores f ON s.fornecedor_id = f.id
            WHERE s.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao obter serviço:', error);
        res.status(500).json({ error: 'Erro ao obter serviço' });
    }
};

// Criar serviço
exports.criar = async (req, res) => {
    try {
        const { nome, fornecedor_id, preco_estimado, tempo_estimado, notas } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const [result] = await db.query(
            `INSERT INTO servicos_externos (nome, fornecedor_id, preco_estimado, tempo_estimado, notas)
             VALUES (?, ?, ?, ?, ?)`,
            [
                nome.trim(),
                fornecedor_id || null,
                preco_estimado || 0,
                tempo_estimado || 0,
                notas || null
            ]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Serviço criado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar serviço:', error);
        res.status(500).json({ error: 'Erro ao criar serviço' });
    }
};

// Atualizar serviço
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, fornecedor_id, preco_estimado, tempo_estimado, notas, ativo } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const [result] = await db.query(
            `UPDATE servicos_externos SET
                nome = ?, fornecedor_id = ?, preco_estimado = ?,
                tempo_estimado = ?, notas = ?, ativo = ?
             WHERE id = ?`,
            [
                nome.trim(),
                fornecedor_id || null,
                preco_estimado || 0,
                tempo_estimado || 0,
                notas || null,
                ativo !== false,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }

        res.json({ message: 'Serviço atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar serviço:', error);
        res.status(500).json({ error: 'Erro ao atualizar serviço' });
    }
};

// Eliminar serviço
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se está em uso em BOMs
        const [bom] = await db.query(
            'SELECT COUNT(*) as count FROM bom_linhas WHERE servico_id = ?',
            [id]
        );

        if (bom[0].count > 0) {
            await db.query('UPDATE servicos_externos SET ativo = FALSE WHERE id = ?', [id]);
            return res.json({ message: 'Serviço desativado (está em uso em BOMs)' });
        }

        const [result] = await db.query('DELETE FROM servicos_externos WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }

        res.json({ message: 'Serviço eliminado com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar serviço:', error);
        res.status(500).json({ error: 'Erro ao eliminar serviço' });
    }
};
