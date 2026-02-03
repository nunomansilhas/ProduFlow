/**
 * ProduFlow - Controller de Categorias
 */

const db = require('../config/database');

// Listar todas as categorias
exports.listar = async (req, res) => {
    try {
        const { tipo } = req.query;

        let sql = 'SELECT * FROM categorias';
        const params = [];

        if (tipo) {
            sql += ' WHERE tipo = ?';
            params.push(tipo);
        }

        sql += ' ORDER BY tipo, nome';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ error: 'Erro ao listar categorias' });
    }
};

// Obter categoria por ID
exports.obter = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM categorias WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao obter categoria:', error);
        res.status(500).json({ error: 'Erro ao obter categoria' });
    }
};

// Criar categoria
exports.criar = async (req, res) => {
    try {
        const { nome, tipo } = req.body;

        if (!nome || !tipo) {
            return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
        }

        if (!['produto', 'material'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo deve ser "produto" ou "material"' });
        }

        const [result] = await db.query(
            'INSERT INTO categorias (nome, tipo) VALUES (?, ?)',
            [nome.trim(), tipo]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Categoria criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ error: 'Erro ao criar categoria' });
    }
};

// Atualizar categoria
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, tipo } = req.body;

        if (!nome || !tipo) {
            return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
        }

        if (!['produto', 'material'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo deve ser "produto" ou "material"' });
        }

        const [result] = await db.query(
            'UPDATE categorias SET nome = ?, tipo = ? WHERE id = ?',
            [nome.trim(), tipo, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }

        res.json({ message: 'Categoria atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
};

// Eliminar categoria
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se tem produtos ou matérias associados
        const [produtos] = await db.query(
            'SELECT COUNT(*) as count FROM produtos WHERE categoria_id = ?',
            [id]
        );
        const [materias] = await db.query(
            'SELECT COUNT(*) as count FROM materias_primas WHERE categoria_id = ?',
            [id]
        );

        if (produtos[0].count > 0 || materias[0].count > 0) {
            return res.status(400).json({
                error: 'Não é possível eliminar. Existem produtos ou matérias associados a esta categoria.'
            });
        }

        const [result] = await db.query('DELETE FROM categorias WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }

        res.json({ message: 'Categoria eliminada com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar categoria:', error);
        res.status(500).json({ error: 'Erro ao eliminar categoria' });
    }
};
