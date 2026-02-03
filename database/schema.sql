-- ProduFlow - Schema da Base de Dados
-- Sistema de Gestão de Produção Industrial
-- Mansilhas & Cia

-- Criar base de dados
DROP DATABASE IF EXISTS produflow;
CREATE DATABASE produflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE produflow;

-- ============================================
-- TABELAS AUXILIARES
-- ============================================

-- Utilizadores do sistema
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'gestor') NOT NULL DEFAULT 'gestor',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categorias (para produtos e materiais)
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('produto', 'material') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fornecedores
CREATE TABLE fornecedores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    contacto VARCHAR(100),
    email VARCHAR(150),
    telefone VARCHAR(30),
    morada TEXT,
    nif VARCHAR(20),
    notas TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Clientes (simplificado)
CREATE TABLE clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    contacto VARCHAR(100),
    email VARCHAR(150),
    telefone VARCHAR(30),
    morada TEXT,
    nif VARCHAR(20),
    notas TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABELAS CORE - MATERIAIS E STOCK
-- ============================================

-- Matérias-Primas
CREATE TABLE materias_primas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(200) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    categoria_id INT,
    unidade ENUM('unidades', 'metros', 'm2', 'litros', 'kg') NOT NULL DEFAULT 'unidades',
    fornecedor_id INT,
    stock_minimo DECIMAL(10, 2) DEFAULT 0,
    localizacao VARCHAR(100),
    preco_unitario DECIMAL(10, 2) DEFAULT 0,
    imagem VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
);

-- Stock atual
CREATE TABLE stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    materia_id INT NOT NULL UNIQUE,
    quantidade DECIMAL(10, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias_primas(id) ON DELETE CASCADE
);

-- Movimentos de Stock
CREATE TABLE stock_movimentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stock_id INT NOT NULL,
    tipo ENUM('entrada', 'saida', 'ajuste') NOT NULL,
    quantidade DECIMAL(10, 2) NOT NULL,
    ordem_id INT DEFAULT NULL,
    motivo VARCHAR(255),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- TABELAS CORE - PRODUTOS E BOM
-- ============================================

-- Produtos
CREATE TABLE produtos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    categoria_id INT,
    descricao TEXT,
    imagem VARCHAR(255),
    custo_estimado DECIMAL(10, 2) DEFAULT 0,
    tempo_estimado INT DEFAULT 0 COMMENT 'minutos',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Serviços Externos (Zincagem, Lacagem, etc.)
CREATE TABLE servicos_externos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    fornecedor_id INT,
    preco_estimado DECIMAL(10, 2) DEFAULT 0,
    tempo_estimado INT DEFAULT 0 COMMENT 'dias úteis',
    notas TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
);

-- BOM (Bill of Materials) - Linhas
CREATE TABLE bom_linhas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produto_id INT NOT NULL,
    tipo ENUM('material', 'subproduto', 'servico_externo') NOT NULL,
    material_id INT DEFAULT NULL,
    subproduto_id INT DEFAULT NULL,
    servico_id INT DEFAULT NULL,
    quantidade DECIMAL(10, 3) NOT NULL,
    unidade VARCHAR(20),
    tolerancia DECIMAL(5, 2) DEFAULT 0 COMMENT 'percentagem de desperdício',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materias_primas(id) ON DELETE CASCADE,
    FOREIGN KEY (subproduto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (servico_id) REFERENCES servicos_externos(id) ON DELETE CASCADE,
    -- Verificar que o tipo corresponde ao campo preenchido
    CONSTRAINT chk_bom_tipo CHECK (
        (tipo = 'material' AND material_id IS NOT NULL AND subproduto_id IS NULL AND servico_id IS NULL) OR
        (tipo = 'subproduto' AND subproduto_id IS NOT NULL AND material_id IS NULL AND servico_id IS NULL) OR
        (tipo = 'servico_externo' AND servico_id IS NOT NULL AND material_id IS NULL AND subproduto_id IS NULL)
    )
);

-- ============================================
-- TABELAS CORE - PRODUÇÃO
-- ============================================

-- Estações de Trabalho
CREATE TABLE estacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    ordem_default INT DEFAULT 1,
    cor VARCHAR(20) DEFAULT '#6c757d',
    icone VARCHAR(50) DEFAULT 'fa-cog',
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Configuração de Estações por Produto
CREATE TABLE produto_estacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produto_id INT NOT NULL,
    estacao_id INT NOT NULL,
    ordem INT NOT NULL,
    obrigatoria BOOLEAN DEFAULT TRUE,
    tempo_estimado INT DEFAULT 0 COMMENT 'minutos para esta estação',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (estacao_id) REFERENCES estacoes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_produto_estacao (produto_id, estacao_id)
);

-- Ordens de Produção
CREATE TABLE ordens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(20) NOT NULL UNIQUE,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    cliente_id INT DEFAULT NULL,
    cliente_nome VARCHAR(150),
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_prevista DATE,
    prioridade TINYINT DEFAULT 2 COMMENT '1=baixa, 2=normal, 3=alta, 4=urgente',
    estado ENUM('pendente', 'em_producao', 'aguarda_externo', 'concluida') DEFAULT 'pendente',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Estado das Estações por Ordem
CREATE TABLE ordem_estacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ordem_id INT NOT NULL,
    estacao_id INT NOT NULL,
    ordem INT NOT NULL COMMENT 'ordem na sequência',
    estado ENUM('pendente', 'em_progresso', 'concluido', 'saltado') DEFAULT 'pendente',
    iniciado_em TIMESTAMP NULL,
    concluido_em TIMESTAMP NULL,
    tempo_real INT DEFAULT 0 COMMENT 'minutos de trabalho real',
    notas TEXT,
    FOREIGN KEY (ordem_id) REFERENCES ordens(id) ON DELETE CASCADE,
    FOREIGN KEY (estacao_id) REFERENCES estacoes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_ordem_estacao (ordem_id, estacao_id)
);

-- Materiais Necessários por Ordem
CREATE TABLE ordem_materiais (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ordem_id INT NOT NULL,
    material_id INT NOT NULL,
    quantidade_necessaria DECIMAL(10, 3) NOT NULL,
    quantidade_usada DECIMAL(10, 3) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ordem_id) REFERENCES ordens(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materias_primas(id) ON DELETE CASCADE,
    UNIQUE KEY uk_ordem_material (ordem_id, material_id)
);

-- Serviços Externos por Ordem
CREATE TABLE ordem_servicos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ordem_id INT NOT NULL,
    servico_id INT NOT NULL,
    estado ENUM('pendente', 'enviado', 'recebido') DEFAULT 'pendente',
    enviado_em TIMESTAMP NULL,
    recebido_em TIMESTAMP NULL,
    notas TEXT,
    FOREIGN KEY (ordem_id) REFERENCES ordens(id) ON DELETE CASCADE,
    FOREIGN KEY (servico_id) REFERENCES servicos_externos(id) ON DELETE CASCADE
);

-- ============================================
-- TABELAS - ALERTAS
-- ============================================

-- Alertas do Sistema
CREATE TABLE alertas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo ENUM('stock_baixo', 'stock_negativo', 'material_insuficiente', 'ordem_atrasada') NOT NULL,
    mensagem TEXT NOT NULL,
    ordem_id INT DEFAULT NULL,
    material_id INT DEFAULT NULL,
    visto BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ordem_id) REFERENCES ordens(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materias_primas(id) ON DELETE CASCADE
);

-- ============================================
-- TABELAS - ENCOMENDAS DE MATERIAL
-- ============================================

-- Encomendas de Material a Fornecedores
CREATE TABLE encomendas_material (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fornecedor_id INT NOT NULL,
    material_id INT NOT NULL,
    quantidade DECIMAL(10, 2) NOT NULL,
    estado ENUM('pendente', 'recebida', 'parcial') DEFAULT 'pendente',
    data_prevista DATE,
    data_recebida TIMESTAMP NULL,
    quantidade_recebida DECIMAL(10, 2) DEFAULT 0,
    user_id INT,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materias_primas(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- TABELAS - CONFIGURAÇÃO
-- ============================================

-- Configurações do Sistema
CREATE TABLE config (
    chave VARCHAR(50) PRIMARY KEY,
    valor TEXT,
    descricao VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_materias_categoria ON materias_primas(categoria_id);
CREATE INDEX idx_materias_fornecedor ON materias_primas(fornecedor_id);
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_bom_produto ON bom_linhas(produto_id);
CREATE INDEX idx_ordens_estado ON ordens(estado);
CREATE INDEX idx_ordens_data_prevista ON ordens(data_prevista);
CREATE INDEX idx_ordens_prioridade ON ordens(prioridade);
CREATE INDEX idx_ordem_estacoes_estado ON ordem_estacoes(estado);
CREATE INDEX idx_alertas_visto ON alertas(visto);
CREATE INDEX idx_stock_movimentos_data ON stock_movimentos(created_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Atualizar stock quando há movimento
DELIMITER //

CREATE TRIGGER after_stock_movimento_insert
AFTER INSERT ON stock_movimentos
FOR EACH ROW
BEGIN
    IF NEW.tipo = 'entrada' THEN
        UPDATE stock SET quantidade = quantidade + NEW.quantidade WHERE id = NEW.stock_id;
    ELSEIF NEW.tipo = 'saida' THEN
        UPDATE stock SET quantidade = quantidade - NEW.quantidade WHERE id = NEW.stock_id;
    ELSEIF NEW.tipo = 'ajuste' THEN
        UPDATE stock SET quantidade = NEW.quantidade WHERE id = NEW.stock_id;
    END IF;
END//

DELIMITER ;

-- ============================================
-- PROCEDIMENTOS ARMAZENADOS
-- ============================================

DELIMITER //

-- Gerar número de ordem automático
CREATE FUNCTION gerar_numero_ordem() RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE ano INT;
    DECLARE ultimo_num INT;
    DECLARE novo_numero VARCHAR(20);

    SET ano = YEAR(CURRENT_DATE);

    SELECT COALESCE(MAX(CAST(SUBSTRING(numero, 9) AS UNSIGNED)), 0) INTO ultimo_num
    FROM ordens
    WHERE SUBSTRING(numero, 4, 4) = CAST(ano AS CHAR(4));

    SET novo_numero = CONCAT('OP-', ano, '-', LPAD(ultimo_num + 1, 5, '0'));

    RETURN novo_numero;
END//

DELIMITER ;

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- Vista de stock com alertas
CREATE VIEW v_stock_alertas AS
SELECT
    m.id AS material_id,
    m.nome,
    m.codigo,
    m.unidade,
    m.stock_minimo,
    m.preco_unitario,
    s.quantidade,
    s.id AS stock_id,
    CASE
        WHEN s.quantidade < 0 THEN 'negativo'
        WHEN s.quantidade < m.stock_minimo THEN 'baixo'
        ELSE 'ok'
    END AS estado_stock,
    c.nome AS categoria_nome,
    f.nome AS fornecedor_nome
FROM materias_primas m
LEFT JOIN stock s ON m.id = s.materia_id
LEFT JOIN categorias c ON m.categoria_id = c.id
LEFT JOIN fornecedores f ON m.fornecedor_id = f.id
WHERE m.ativo = TRUE;

-- Vista de ordens em produção
CREATE VIEW v_ordens_producao AS
SELECT
    o.*,
    p.nome AS produto_nome,
    p.sku AS produto_sku,
    oe.estacao_id AS estacao_atual_id,
    e.nome AS estacao_atual_nome,
    e.cor AS estacao_cor,
    DATEDIFF(o.data_prevista, CURRENT_DATE) AS dias_para_entrega
FROM ordens o
JOIN produtos p ON o.produto_id = p.id
LEFT JOIN ordem_estacoes oe ON o.id = oe.ordem_id AND oe.estado = 'em_progresso'
LEFT JOIN estacoes e ON oe.estacao_id = e.id
WHERE o.estado IN ('pendente', 'em_producao', 'aguarda_externo');

-- Vista de dashboard
CREATE VIEW v_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM ordens WHERE estado = 'em_producao') AS em_producao,
    (SELECT COUNT(*) FROM ordens WHERE estado IN ('pendente', 'em_producao') AND prioridade = 4) AS urgentes,
    (SELECT COUNT(*) FROM ordens WHERE estado IN ('pendente', 'em_producao') AND data_prevista < CURRENT_DATE) AS atrasadas,
    (SELECT COUNT(*) FROM ordens WHERE estado = 'aguarda_externo') AS aguarda_externo,
    (SELECT COUNT(*) FROM alertas WHERE visto = FALSE) AS alertas_nao_vistos;
