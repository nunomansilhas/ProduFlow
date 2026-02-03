-- Migração para suportar agrupamento de ordens
-- Executar: mysql -u root -p produflow < database/migrations/add_order_grouping.sql

USE produflow;

-- Adicionar campo de grupo às ordens
-- Ordens com o mesmo grupo_id são processadas juntas
ALTER TABLE ordens ADD COLUMN grupo_id INT NULL AFTER notas;

-- Índice para pesquisa por grupo
CREATE INDEX idx_ordens_grupo ON ordens(grupo_id);

-- Tabela para grupos de produção
CREATE TABLE IF NOT EXISTS grupos_producao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100),
    produto_id INT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
);

-- Adicionar FK para grupo
ALTER TABLE ordens ADD CONSTRAINT fk_ordem_grupo
    FOREIGN KEY (grupo_id) REFERENCES grupos_producao(id) ON DELETE SET NULL;
