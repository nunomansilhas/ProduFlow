/**
 * ProduFlow - Controller de Matérias-Primas
 */

const db = require('../config/database');

// Listar todas as matérias-primas
exports.listar = async (req, res) => {
    try {
        const { categoria_id, fornecedor_id, ativo } = req.query;

        let sql = `
            SELECT m.*,
                   c.nome as categoria_nome,
                   f.nome as fornecedor_nome,
                   COALESCE(s.quantidade, 0) as quantidade
            FROM materias_primas m
            LEFT JOIN categorias c ON m.categoria_id = c.id
            LEFT JOIN fornecedores f ON m.fornecedor_id = f.id
            LEFT JOIN stock s ON m.id = s.materia_id
            WHERE 1=1
        `;
        const params = [];

        if (categoria_id) {
            sql += ' AND m.categoria_id = ?';
            params.push(categoria_id);
        }

        if (fornecedor_id) {
            sql += ' AND m.fornecedor_id = ?';
            params.push(fornecedor_id);
        }

        if (ativo !== undefined) {
            sql += ' AND m.ativo = ?';
            params.push(ativo === 'true' || ativo === '1');
        }

        sql += ' ORDER BY m.nome';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar matérias-primas:', error);
        res.status(500).json({ error: 'Erro ao listar matérias-primas' });
    }
};

// Obter matéria-prima por ID
exports.obter = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT m.*,
                   c.nome as categoria_nome,
                   f.nome as fornecedor_nome,
                   COALESCE(s.quantidade, 0) as quantidade,
                   s.id as stock_id
            FROM materias_primas m
            LEFT JOIN categorias c ON m.categoria_id = c.id
            LEFT JOIN fornecedores f ON m.fornecedor_id = f.id
            LEFT JOIN stock s ON m.id = s.materia_id
            WHERE m.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Matéria-prima não encontrada' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao obter matéria-prima:', error);
        res.status(500).json({ error: 'Erro ao obter matéria-prima' });
    }
};

// Criar matéria-prima
exports.criar = async (req, res) => {
    try {
        const {
            nome, codigo, categoria_id, unidade, fornecedor_id,
            stock_minimo, localizacao, preco_unitario
        } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        if (!unidade) {
            return res.status(400).json({ error: 'Unidade é obrigatória' });
        }

        // Verificar se código já existe
        if (codigo) {
            const [existing] = await db.query(
                'SELECT id FROM materias_primas WHERE codigo = ?',
                [codigo]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Já existe uma matéria-prima com este código' });
            }
        }

        const [result] = await db.query(
            `INSERT INTO materias_primas
             (nome, codigo, categoria_id, unidade, fornecedor_id, stock_minimo, localizacao, preco_unitario)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome.trim(),
                codigo ? codigo.trim().toUpperCase() : null,
                categoria_id || null,
                unidade,
                fornecedor_id || null,
                stock_minimo || 0,
                localizacao || null,
                preco_unitario || 0
            ]
        );

        // Criar registo de stock inicial
        await db.query(
            'INSERT INTO stock (materia_id, quantidade) VALUES (?, 0)',
            [result.insertId]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Matéria-prima criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar matéria-prima:', error);
        res.status(500).json({ error: 'Erro ao criar matéria-prima' });
    }
};

// Atualizar matéria-prima
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome, codigo, categoria_id, unidade, fornecedor_id,
            stock_minimo, localizacao, preco_unitario, ativo
        } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        // Verificar se código já existe (em outra matéria)
        if (codigo) {
            const [existing] = await db.query(
                'SELECT id FROM materias_primas WHERE codigo = ? AND id != ?',
                [codigo, id]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Já existe uma matéria-prima com este código' });
            }
        }

        const [result] = await db.query(
            `UPDATE materias_primas SET
                nome = ?, codigo = ?, categoria_id = ?, unidade = ?,
                fornecedor_id = ?, stock_minimo = ?, localizacao = ?,
                preco_unitario = ?, ativo = ?
             WHERE id = ?`,
            [
                nome.trim(),
                codigo ? codigo.trim().toUpperCase() : null,
                categoria_id || null,
                unidade,
                fornecedor_id || null,
                stock_minimo || 0,
                localizacao || null,
                preco_unitario || 0,
                ativo !== false,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Matéria-prima não encontrada' });
        }

        res.json({ message: 'Matéria-prima atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar matéria-prima:', error);
        res.status(500).json({ error: 'Erro ao atualizar matéria-prima' });
    }
};

// Eliminar matéria-prima (soft delete)
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se está a ser usada em BOMs
        const [bom] = await db.query(
            'SELECT COUNT(*) as count FROM bom_linhas WHERE material_id = ?',
            [id]
        );

        if (bom[0].count > 0) {
            // Soft delete
            await db.query('UPDATE materias_primas SET ativo = FALSE WHERE id = ?', [id]);
            return res.json({ message: 'Matéria-prima desativada (está em uso em BOMs)' });
        }

        // Eliminar stock associado
        await db.query('DELETE FROM stock WHERE materia_id = ?', [id]);

        const [result] = await db.query('DELETE FROM materias_primas WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Matéria-prima não encontrada' });
        }

        res.json({ message: 'Matéria-prima eliminada com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar matéria-prima:', error);
        res.status(500).json({ error: 'Erro ao eliminar matéria-prima' });
    }
};
