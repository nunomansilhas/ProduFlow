/**
 * ProduFlow - Controller de Fornecedores
 */

const db = require('../config/database');

// Listar todos os fornecedores
exports.listar = async (req, res) => {
    try {
        const { ativo } = req.query;

        let sql = 'SELECT * FROM fornecedores';
        const params = [];

        if (ativo !== undefined) {
            sql += ' WHERE ativo = ?';
            params.push(ativo === 'true' || ativo === '1');
        }

        sql += ' ORDER BY nome';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar fornecedores:', error);
        res.status(500).json({ error: 'Erro ao listar fornecedores' });
    }
};

// Obter fornecedor por ID
exports.obter = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM fornecedores WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao obter fornecedor:', error);
        res.status(500).json({ error: 'Erro ao obter fornecedor' });
    }
};

// Criar fornecedor
exports.criar = async (req, res) => {
    try {
        const { nome, contacto, email, telefone, morada, nif, notas } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const [result] = await db.query(
            `INSERT INTO fornecedores (nome, contacto, email, telefone, morada, nif, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nome.trim(), contacto || null, email || null, telefone || null, morada || null, nif || null, notas || null]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Fornecedor criado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar fornecedor:', error);
        res.status(500).json({ error: 'Erro ao criar fornecedor' });
    }
};

// Atualizar fornecedor
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, contacto, email, telefone, morada, nif, notas, ativo } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const [result] = await db.query(
            `UPDATE fornecedores SET
                nome = ?, contacto = ?, email = ?, telefone = ?,
                morada = ?, nif = ?, notas = ?, ativo = ?
             WHERE id = ?`,
            [nome.trim(), contacto || null, email || null, telefone || null,
             morada || null, nif || null, notas || null, ativo !== false, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        res.json({ message: 'Fornecedor atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar fornecedor:', error);
        res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
    }
};

// Eliminar fornecedor (soft delete)
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se tem matérias ou serviços associados
        const [materias] = await db.query(
            'SELECT COUNT(*) as count FROM materias_primas WHERE fornecedor_id = ?',
            [id]
        );
        const [servicos] = await db.query(
            'SELECT COUNT(*) as count FROM servicos_externos WHERE fornecedor_id = ?',
            [id]
        );

        if (materias[0].count > 0 || servicos[0].count > 0) {
            // Soft delete - apenas desativar
            await db.query('UPDATE fornecedores SET ativo = FALSE WHERE id = ?', [id]);
            return res.json({ message: 'Fornecedor desativado (tem registos associados)' });
        }

        const [result] = await db.query('DELETE FROM fornecedores WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        res.json({ message: 'Fornecedor eliminado com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar fornecedor:', error);
        res.status(500).json({ error: 'Erro ao eliminar fornecedor' });
    }
};
