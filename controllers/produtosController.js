/**
 * ProduFlow - Controller de Produtos
 */

const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// Listar todos os produtos
exports.listar = async (req, res) => {
    try {
        const { categoria_id, ativo } = req.query;

        let sql = `
            SELECT p.*,
                   c.nome AS categoria_nome,
                   (SELECT COUNT(*) FROM bom_linhas WHERE produto_id = p.id) AS bom_linhas
            FROM produtos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (categoria_id) {
            sql += ' AND p.categoria_id = ?';
            params.push(categoria_id);
        }

        if (ativo !== undefined) {
            sql += ' AND p.ativo = ?';
            params.push(ativo === 'true' || ativo === '1');
        }

        sql += ' ORDER BY p.nome';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ error: 'Erro ao listar produtos' });
    }
};

// Obter produto por ID
exports.obter = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT p.*,
                   c.nome AS categoria_nome
            FROM produtos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        // Buscar estações configuradas
        const [estacoes] = await db.query(`
            SELECT pe.*, e.nome AS estacao_nome, e.cor, e.icone
            FROM produto_estacoes pe
            JOIN estacoes e ON pe.estacao_id = e.id
            WHERE pe.produto_id = ?
            ORDER BY pe.ordem
        `, [id]);

        const produto = rows[0];
        produto.estacoes = estacoes;

        res.json(produto);
    } catch (error) {
        console.error('Erro ao obter produto:', error);
        res.status(500).json({ error: 'Erro ao obter produto' });
    }
};

// Criar produto
exports.criar = async (req, res) => {
    try {
        const { nome, sku, categoria_id, descricao, custo_estimado, tempo_estimado } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        // Verificar se SKU já existe
        if (sku) {
            const [existing] = await db.query(
                'SELECT id FROM produtos WHERE sku = ?',
                [sku]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Já existe um produto com este SKU' });
            }
        }

        const [result] = await db.query(
            `INSERT INTO produtos (nome, sku, categoria_id, descricao, custo_estimado, tempo_estimado)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                nome.trim(),
                sku ? sku.trim().toUpperCase() : null,
                categoria_id || null,
                descricao || null,
                custo_estimado || 0,
                tempo_estimado || 0
            ]
        );

        // Criar estações default para o produto
        const [estacoes] = await db.query(
            'SELECT id, ordem_default FROM estacoes WHERE ativa = TRUE ORDER BY ordem_default'
        );

        for (const estacao of estacoes) {
            await db.query(
                `INSERT INTO produto_estacoes (produto_id, estacao_id, ordem, obrigatoria)
                 VALUES (?, ?, ?, TRUE)`,
                [result.insertId, estacao.id, estacao.ordem_default]
            );
        }

        res.status(201).json({
            id: result.insertId,
            message: 'Produto criado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
};

// Atualizar produto
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, sku, categoria_id, descricao, custo_estimado, tempo_estimado, ativo } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        // Verificar se SKU já existe (em outro produto)
        if (sku) {
            const [existing] = await db.query(
                'SELECT id FROM produtos WHERE sku = ? AND id != ?',
                [sku, id]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Já existe um produto com este SKU' });
            }
        }

        const [result] = await db.query(
            `UPDATE produtos SET
                nome = ?, sku = ?, categoria_id = ?, descricao = ?,
                custo_estimado = ?, tempo_estimado = ?, ativo = ?
             WHERE id = ?`,
            [
                nome.trim(),
                sku ? sku.trim().toUpperCase() : null,
                categoria_id || null,
                descricao || null,
                custo_estimado || 0,
                tempo_estimado || 0,
                ativo !== false,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json({ message: 'Produto atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
};

// Eliminar produto
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se tem ordens associadas
        const [ordens] = await db.query(
            'SELECT COUNT(*) as count FROM ordens WHERE produto_id = ?',
            [id]
        );

        if (ordens[0].count > 0) {
            // Soft delete
            await db.query('UPDATE produtos SET ativo = FALSE WHERE id = ?', [id]);
            return res.json({ message: 'Produto desativado (tem ordens associadas)' });
        }

        // Verificar se é usado como sub-produto em BOMs
        const [bom] = await db.query(
            'SELECT COUNT(*) as count FROM bom_linhas WHERE subproduto_id = ?',
            [id]
        );

        if (bom[0].count > 0) {
            await db.query('UPDATE produtos SET ativo = FALSE WHERE id = ?', [id]);
            return res.json({ message: 'Produto desativado (é usado como sub-produto)' });
        }

        // Eliminar BOM, estações e produto
        await db.query('DELETE FROM bom_linhas WHERE produto_id = ?', [id]);
        await db.query('DELETE FROM produto_estacoes WHERE produto_id = ?', [id]);

        const [result] = await db.query('DELETE FROM produtos WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json({ message: 'Produto eliminado com sucesso' });
    } catch (error) {
        console.error('Erro ao eliminar produto:', error);
        res.status(500).json({ error: 'Erro ao eliminar produto' });
    }
};

// Atualizar estações do produto
exports.atualizarEstacoes = async (req, res) => {
    try {
        const { id } = req.params;
        const { estacoes } = req.body;

        if (!Array.isArray(estacoes)) {
            return res.status(400).json({ error: 'Estações devem ser um array' });
        }

        // Eliminar configuração atual
        await db.query('DELETE FROM produto_estacoes WHERE produto_id = ?', [id]);

        // Inserir nova configuração
        for (const est of estacoes) {
            await db.query(
                `INSERT INTO produto_estacoes (produto_id, estacao_id, ordem, obrigatoria, tempo_estimado)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, est.estacao_id, est.ordem, est.obrigatoria !== false, est.tempo_estimado || 0]
            );
        }

        res.json({ message: 'Estações atualizadas com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar estações:', error);
        res.status(500).json({ error: 'Erro ao atualizar estações' });
    }
};

// Calcular custo estimado baseado no BOM
exports.calcularCusto = async (req, res) => {
    try {
        const { id } = req.params;
        const bomCalculator = require('../utils/bomCalculator');

        const custo = await bomCalculator.calcularCustoBOM(id);

        // Atualizar custo no produto
        await db.query(
            'UPDATE produtos SET custo_estimado = ? WHERE id = ?',
            [custo.total, id]
        );

        res.json(custo);
    } catch (error) {
        console.error('Erro ao calcular custo:', error);
        res.status(500).json({ error: 'Erro ao calcular custo' });
    }
};
