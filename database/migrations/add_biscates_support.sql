-- Migração para suportar "Biscates" (ordens sem produto vinculado)
-- Executar: mysql -u root -p produflow < database/migrations/add_biscates_support.sql

USE produflow;

-- Permitir produto_id nulo (para ordens ad-hoc/biscates)
ALTER TABLE ordens MODIFY COLUMN produto_id INT NULL;

-- Adicionar campo para descrição do trabalho personalizado
ALTER TABLE ordens ADD COLUMN descricao_trabalho TEXT AFTER quantidade;

-- Atualizar views para suportar ordens sem produto
DROP VIEW IF EXISTS v_ordens_producao;
CREATE VIEW v_ordens_producao AS
SELECT
    o.*,
    COALESCE(p.nome, o.descricao_trabalho, 'Trabalho Ad-hoc') AS produto_nome,
    p.sku AS produto_sku,
    oe.estacao_id AS estacao_atual_id,
    e.nome AS estacao_atual_nome,
    e.cor AS estacao_cor,
    DATEDIFF(o.data_prevista, CURRENT_DATE) AS dias_para_entrega
FROM ordens o
LEFT JOIN produtos p ON o.produto_id = p.id
LEFT JOIN ordem_estacoes oe ON o.id = oe.ordem_id AND oe.estado = 'em_progresso'
LEFT JOIN estacoes e ON oe.estacao_id = e.id
WHERE o.estado IN ('pendente', 'em_producao', 'aguarda_externo');
