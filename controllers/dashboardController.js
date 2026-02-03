/**
 * ProduFlow - Controller do Dashboard
 */

const db = require('../config/database');

// Obter estatísticas do dashboard
exports.stats = async (req, res) => {
    try {
        // Ordens em produção
        const [emProducao] = await db.query(
            `SELECT COUNT(*) as count FROM ordens WHERE estado = 'em_producao'`
        );

        // Ordens urgentes
        const [urgentes] = await db.query(
            `SELECT COUNT(*) as count FROM ordens
             WHERE estado IN ('pendente', 'em_producao') AND prioridade = 4`
        );

        // Ordens atrasadas
        const [atrasadas] = await db.query(
            `SELECT COUNT(*) as count FROM ordens
             WHERE estado IN ('pendente', 'em_producao') AND data_prevista < CURRENT_DATE`
        );

        // Aguardando serviço externo
        const [aguardaExterno] = await db.query(
            `SELECT COUNT(*) as count FROM ordens WHERE estado = 'aguarda_externo'`
        );

        // Alertas não vistos
        const [alertas] = await db.query(
            `SELECT COUNT(*) as count FROM alertas WHERE visto = FALSE`
        );

        // Total de ordens pendentes
        const [pendentes] = await db.query(
            `SELECT COUNT(*) as count FROM ordens WHERE estado = 'pendente'`
        );

        res.json({
            em_producao: emProducao[0].count,
            urgentes: urgentes[0].count,
            atrasadas: atrasadas[0].count,
            aguarda_externo: aguardaExterno[0].count,
            alertas_nao_vistos: alertas[0].count,
            pendentes: pendentes[0].count
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
};

// Ordens em produção (para tabela do dashboard)
exports.ordensEmProducao = async (req, res) => {
    try {
        const { limite = 10 } = req.query;

        const [rows] = await db.query(`
            SELECT
                o.id,
                o.numero,
                o.quantidade,
                o.prioridade,
                o.estado,
                o.data_prevista,
                p.nome AS produto_nome,
                p.sku AS produto_sku,
                e.nome AS estacao_atual,
                e.cor AS estacao_cor,
                DATEDIFF(o.data_prevista, CURRENT_DATE) AS dias_para_entrega
            FROM ordens o
            JOIN produtos p ON o.produto_id = p.id
            LEFT JOIN ordem_estacoes oe ON o.id = oe.ordem_id AND oe.estado = 'em_progresso'
            LEFT JOIN estacoes e ON oe.estacao_id = e.id
            WHERE o.estado IN ('em_producao', 'aguarda_externo')
            ORDER BY o.prioridade DESC, o.data_prevista
            LIMIT ?
        `, [parseInt(limite)]);

        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter ordens em produção:', error);
        res.status(500).json({ error: 'Erro ao obter ordens em produção' });
    }
};

// Alertas recentes
exports.alertasRecentes = async (req, res) => {
    try {
        const { limite = 5 } = req.query;

        const [rows] = await db.query(`
            SELECT a.*,
                   m.nome AS material_nome,
                   o.numero AS ordem_numero
            FROM alertas a
            LEFT JOIN materias_primas m ON a.material_id = m.id
            LEFT JOIN ordens o ON a.ordem_id = o.id
            WHERE a.visto = FALSE
            ORDER BY a.created_at DESC
            LIMIT ?
        `, [parseInt(limite)]);

        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter alertas:', error);
        res.status(500).json({ error: 'Erro ao obter alertas' });
    }
};

// Stock com problemas
exports.stockProblemas = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                m.id,
                m.nome,
                m.codigo,
                m.unidade,
                m.stock_minimo,
                COALESCE(s.quantidade, 0) AS quantidade,
                CASE
                    WHEN s.quantidade < 0 THEN 'negativo'
                    WHEN s.quantidade < m.stock_minimo THEN 'baixo'
                END AS problema
            FROM materias_primas m
            LEFT JOIN stock s ON m.id = s.materia_id
            WHERE m.ativo = TRUE
              AND (s.quantidade < 0 OR s.quantidade < m.stock_minimo)
            ORDER BY
                CASE WHEN s.quantidade < 0 THEN 0 ELSE 1 END,
                m.nome
            LIMIT 10
        `);

        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter stock com problemas:', error);
        res.status(500).json({ error: 'Erro ao obter stock com problemas' });
    }
};

// Resumo por estação
exports.resumoEstacoes = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                e.id,
                e.nome,
                e.cor,
                e.icone,
                COUNT(CASE WHEN oe.estado = 'em_progresso' THEN 1 END) AS em_progresso,
                COUNT(CASE WHEN oe.estado = 'pendente' AND o.estado != 'pendente' THEN 1 END) AS na_fila
            FROM estacoes e
            LEFT JOIN ordem_estacoes oe ON e.id = oe.estacao_id
            LEFT JOIN ordens o ON oe.ordem_id = o.id AND o.estado IN ('em_producao', 'aguarda_externo')
            WHERE e.ativa = TRUE
            GROUP BY e.id
            ORDER BY e.ordem_default
        `);

        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter resumo de estações:', error);
        res.status(500).json({ error: 'Erro ao obter resumo de estações' });
    }
};
