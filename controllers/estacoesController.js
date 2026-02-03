/**
 * ProduFlow - Controller de Estações de Trabalho
 */

const db = require('../config/database');

// Listar todas as estações
exports.listar = async (req, res) => {
    try {
        const { ativa } = req.query;

        let sql = 'SELECT * FROM estacoes';
        const params = [];

        if (ativa !== undefined) {
            sql += ' WHERE ativa = ?';
            params.push(ativa === 'true' || ativa === '1');
        }

        sql += ' ORDER BY ordem_default';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar estações:', error);
        res.status(500).json({ error: 'Erro ao listar estações' });
    }
};

// Obter estação por ID
exports.obter = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM estacoes WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Estação não encontrada' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao obter estação:', error);
        res.status(500).json({ error: 'Erro ao obter estação' });
    }
};

// Criar estação
exports.criar = async (req, res) => {
    try {
        const { nome, ordem_default, cor, icone } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        // Se ordem não especificada, usar o próximo número
        let ordem = ordem_default;
        if (!ordem) {
            const [max] = await db.query('SELECT MAX(ordem_default) as max_ordem FROM estacoes');
            ordem = (max[0].max_ordem || 0) + 1;
        }

        const [result] = await db.query(
            `INSERT INTO estacoes (nome, ordem_default, cor, icone)
             VALUES (?, ?, ?, ?)`,
            [nome.trim(), ordem, cor || '#6c757d', icone || 'fa-cog']
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Estação criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar estação:', error);
        res.status(500).json({ error: 'Erro ao criar estação' });
    }
};

// Atualizar estação
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, ordem_default, cor, icone, ativa } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const [result] = await db.query(
            `UPDATE estacoes SET
                nome = ?, ordem_default = ?, cor = ?, icone = ?, ativa = ?
             WHERE id = ?`,
            [nome.trim(), ordem_default || 1, cor || '#6c757d', icone || 'fa-cog', ativa !== false, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Estação não encontrada' });
        }

        res.json({ message: 'Estação atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar estação:', error);
        res.status(500).json({ error: 'Erro ao atualizar estação' });
    }
};

// Eliminar estação
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se tem ordens em progresso
        const [ordens] = await db.query(
            `SELECT COUNT(*) as count FROM ordem_estacoes
             WHERE estacao_id = ? AND estado IN ('em_progresso')`,
            [id]
        );

        if (ordens[0].count > 0) {
            return res.status(400).json({
                error: 'Não é possível eliminar. Existem ordens em progresso nesta estação.'
            });
        }

        // Verificar se está configurada em produtos
        const [produtos] = await db.query(
            'SELECT COUNT(*) as count FROM produto_estacoes WHERE estacao_id = ?',
            [id]
        );

        if (produtos[0].count > 0) {
            // Soft delete
            await db.query('UPDATE estacoes SET ativa = FALSE WHERE id = ?', [id]);
            return res.json({ message: 'Estação desativada (está configurada em produtos)' });
        }

        const [result] = await db.query('DELETE FROM estacoes WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Estação não encontrada' });
        }

        res.json({ message: 'Estação eliminada com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar estação:', error);
        res.status(500).json({ error: 'Erro ao eliminar estação' });
    }
};

// Reordenar estações
exports.reordenar = async (req, res) => {
    try {
        const { ordem } = req.body;

        if (!Array.isArray(ordem)) {
            return res.status(400).json({ error: 'Ordem deve ser um array de IDs' });
        }

        for (let i = 0; i < ordem.length; i++) {
            await db.query(
                'UPDATE estacoes SET ordem_default = ? WHERE id = ?',
                [i + 1, ordem[i]]
            );
        }

        res.json({ message: 'Ordem atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao reordenar estações:', error);
        res.status(500).json({ error: 'Erro ao reordenar estações' });
    }
};

// Obter ordens pendentes numa estação
exports.ordensNaEstacao = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                o.*,
                COALESCE(p.nome, o.descricao_trabalho, 'Biscate') AS produto_nome,
                p.sku AS produto_sku,
                oe.estado AS estado_estacao,
                oe.iniciado_em
            FROM ordem_estacoes oe
            JOIN ordens o ON oe.ordem_id = o.id
            LEFT JOIN produtos p ON o.produto_id = p.id
            WHERE oe.estacao_id = ?
              AND oe.estado IN ('pendente', 'em_progresso')
              AND o.estado != 'concluida'
            ORDER BY o.prioridade DESC, oe.estado DESC, o.data_prevista
        `, [id]);

        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter ordens na estação:', error);
        res.status(500).json({ error: 'Erro ao obter ordens na estação' });
    }
};
