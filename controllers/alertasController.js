/**
 * ProduFlow - Controller de Alertas
 */

const db = require('../config/database');

// Listar alertas
exports.listar = async (req, res) => {
    try {
        const { tipo, visto, limite = 50 } = req.query;

        let sql = `
            SELECT a.*,
                   m.nome AS material_nome,
                   m.codigo AS material_codigo,
                   o.numero AS ordem_numero
            FROM alertas a
            LEFT JOIN materias_primas m ON a.material_id = m.id
            LEFT JOIN ordens o ON a.ordem_id = o.id
            WHERE 1=1
        `;
        const params = [];

        if (tipo) {
            sql += ' AND a.tipo = ?';
            params.push(tipo);
        }

        if (visto !== undefined) {
            sql += ' AND a.visto = ?';
            params.push(visto === 'true' || visto === '1');
        }

        sql += ' ORDER BY a.visto ASC, a.created_at DESC';
        sql += ` LIMIT ${parseInt(limite)}`;

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar alertas:', error);
        res.status(500).json({ error: 'Erro ao listar alertas' });
    }
};

// Contar alertas não vistos
exports.naoVistos = async (req, res) => {
    try {
        const [result] = await db.query(
            'SELECT COUNT(*) AS count FROM alertas WHERE visto = FALSE'
        );
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('Erro ao contar alertas:', error);
        res.status(500).json({ error: 'Erro ao contar alertas' });
    }
};

// Marcar alerta como visto
exports.marcarVisto = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'UPDATE alertas SET visto = TRUE WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Alerta não encontrado' });
        }

        res.json({ message: 'Alerta marcado como visto' });
    } catch (error) {
        console.error('Erro ao marcar alerta:', error);
        res.status(500).json({ error: 'Erro ao marcar alerta' });
    }
};

// Marcar todos como vistos
exports.marcarTodosVistos = async (req, res) => {
    try {
        await db.query('UPDATE alertas SET visto = TRUE WHERE visto = FALSE');
        res.json({ message: 'Todos os alertas foram marcados como vistos' });
    } catch (error) {
        console.error('Erro ao marcar alertas:', error);
        res.status(500).json({ error: 'Erro ao marcar alertas' });
    }
};

// Eliminar alerta
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM alertas WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Alerta não encontrado' });
        }

        res.json({ message: 'Alerta eliminado com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar alerta:', error);
        res.status(500).json({ error: 'Erro ao eliminar alerta' });
    }
};

// Limpar alertas antigos (mais de 30 dias)
exports.limparAntigos = async (req, res) => {
    try {
        const [result] = await db.query(
            `DELETE FROM alertas
             WHERE visto = TRUE AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );

        res.json({
            message: 'Alertas antigos eliminados',
            eliminados: result.affectedRows
        });
    } catch (error) {
        console.error('Erro ao limpar alertas:', error);
        res.status(500).json({ error: 'Erro ao limpar alertas' });
    }
};
