-- ProduFlow - Dados de Exemplo (Seeds)
-- Sistema de Gestão de Produção Industrial

USE produflow;

-- ============================================
-- UTILIZADOR ADMIN
-- ============================================
-- Password: admin123 (hash bcrypt)
INSERT INTO users (nome, email, password_hash, role) VALUES
('Administrador', 'admin@mansilhas.pt', '$2b$10$rqJPp1TnP5XYdGvHjNqNS.CmQO8a3xXlXvqL9KvDMNZJ5JrYJ5Ksa', 'admin'),
('Gestor Produção', 'gestor@mansilhas.pt', '$2b$10$rqJPp1TnP5XYdGvHjNqNS.CmQO8a3xXlXvqL9KvDMNZJ5JrYJ5Ksa', 'gestor');

-- ============================================
-- CATEGORIAS
-- ============================================
INSERT INTO categorias (nome, tipo) VALUES
-- Categorias de Produtos
('Carrinhos de Transporte', 'produto'),
('Paletes', 'produto'),
('Contentores', 'produto'),
('Equipamento Padaria', 'produto'),
('Racks e Estantes', 'produto'),
('Peças Avulsas', 'produto'),
-- Categorias de Materiais
('Tubos', 'material'),
('Chapas', 'material'),
('Perfis', 'material'),
('Rodas e Rodízios', 'material'),
('Parafusaria', 'material'),
('Acessórios', 'material'),
('Consumíveis', 'material');

-- ============================================
-- FORNECEDORES
-- ============================================
INSERT INTO fornecedores (nome, contacto, email, telefone, morada, nif) VALUES
('Aços Ramadas', 'João Silva', 'comercial@acosramadas.pt', '253 100 200', 'Zona Industrial de Ramadas, Braga', '500100200'),
('Inox Center', 'Maria Santos', 'vendas@inoxcenter.pt', '224 500 600', 'Porto', '501200300'),
('Rodízios Portugal', 'António Costa', 'geral@rodiziospt.pt', '219 800 900', 'Lisboa', '502300400'),
('Parafusos & Cia', 'Manuel Ferreira', 'encomendas@parafusoscia.pt', '234 100 200', 'Aveiro', '503400500'),
('Zincagem Norte', 'Pedro Oliveira', 'orcamentos@zincagemnorte.pt', '253 200 300', 'Barcelos', '504500600'),
('Lacagem Premium', 'Ana Rodrigues', 'info@lacagempremium.pt', '229 400 500', 'V.N. Gaia', '505600700');

-- ============================================
-- MATÉRIAS-PRIMAS
-- ============================================
INSERT INTO materias_primas (nome, codigo, categoria_id, unidade, fornecedor_id, stock_minimo, localizacao, preco_unitario) VALUES
-- Tubos (categoria 7)
('Tubo Inox AISI 304 - 30mm', 'TUB-INOX-30', 7, 'metros', 2, 50, 'Prateleira A1', 8.50),
('Tubo Inox AISI 304 - 40mm', 'TUB-INOX-40', 7, 'metros', 2, 30, 'Prateleira A2', 12.00),
('Tubo Inox AISI 304 - 50mm', 'TUB-INOX-50', 7, 'metros', 2, 20, 'Prateleira A3', 15.50),
('Tubo Alumínio 30mm', 'TUB-ALU-30', 7, 'metros', 1, 40, 'Prateleira B1', 5.20),
('Tubo Alumínio 40mm', 'TUB-ALU-40', 7, 'metros', 1, 25, 'Prateleira B2', 7.80),

-- Chapas (categoria 8)
('Chapa Inox 1mm', 'CHP-INOX-1', 8, 'm2', 2, 20, 'Zona Chapas 1', 45.00),
('Chapa Inox 2mm', 'CHP-INOX-2', 8, 'm2', 2, 15, 'Zona Chapas 2', 85.00),
('Chapa Alumínio 1mm', 'CHP-ALU-1', 8, 'm2', 1, 25, 'Zona Chapas 3', 28.00),
('Chapa Alumínio 2mm', 'CHP-ALU-2', 8, 'm2', 1, 15, 'Zona Chapas 4', 52.00),

-- Perfis (categoria 9)
('Cantoneira Inox 40x40mm', 'CANT-INOX-40', 9, 'metros', 2, 20, 'Prateleira C1', 6.50),
('Cantoneira Alumínio 40x40mm', 'CANT-ALU-40', 9, 'metros', 1, 25, 'Prateleira C2', 4.20),

-- Rodas (categoria 10)
('Roda Giratória 100mm c/ Travão', 'ROD-GIR-100T', 10, 'unidades', 3, 40, 'Prateleira D1', 12.50),
('Roda Giratória 100mm', 'ROD-GIR-100', 10, 'unidades', 3, 50, 'Prateleira D2', 8.90),
('Roda Fixa 100mm', 'ROD-FIX-100', 10, 'unidades', 3, 30, 'Prateleira D3', 6.50),
('Roda Giratória 125mm c/ Travão', 'ROD-GIR-125T', 10, 'unidades', 3, 20, 'Prateleira D4', 18.00),

-- Parafusaria (categoria 11)
('Parafuso M8x20 Inox', 'PAR-M8-20', 11, 'unidades', 4, 500, 'Gaveta P1', 0.15),
('Parafuso M8x30 Inox', 'PAR-M8-30', 11, 'unidades', 4, 500, 'Gaveta P2', 0.18),
('Parafuso M10x30 Inox', 'PAR-M10-30', 11, 'unidades', 4, 300, 'Gaveta P3', 0.25),
('Porca M8 Inox', 'POR-M8', 11, 'unidades', 4, 500, 'Gaveta P4', 0.08),
('Porca M10 Inox', 'POR-M10', 11, 'unidades', 4, 300, 'Gaveta P5', 0.12),
('Anilha M8 Inox', 'ANI-M8', 11, 'unidades', 4, 500, 'Gaveta P6', 0.05),

-- Acessórios (categoria 12)
('Pega Tubular Inox 200mm', 'PEG-INOX-200', 12, 'unidades', 2, 30, 'Prateleira E1', 8.50),
('Pega Tubular Inox 300mm', 'PEG-INOX-300', 12, 'unidades', 2, 20, 'Prateleira E2', 12.00),
('Batente Borracha 50mm', 'BAT-BOR-50', 12, 'unidades', 4, 50, 'Prateleira E3', 2.50);

-- ============================================
-- STOCK INICIAL
-- ============================================
INSERT INTO stock (materia_id, quantidade) VALUES
(1, 120.5),   -- Tubo Inox 30mm
(2, 85.0),    -- Tubo Inox 40mm
(3, 45.0),    -- Tubo Inox 50mm
(4, 150.0),   -- Tubo Alumínio 30mm
(5, 80.0),    -- Tubo Alumínio 40mm
(6, 35.0),    -- Chapa Inox 1mm
(7, 25.0),    -- Chapa Inox 2mm
(8, 50.0),    -- Chapa Alumínio 1mm
(9, 30.0),    -- Chapa Alumínio 2mm
(10, 60.0),   -- Cantoneira Inox
(11, 75.0),   -- Cantoneira Alumínio
(12, 48),     -- Roda Giratória 100mm c/ Travão
(13, 65),     -- Roda Giratória 100mm
(14, 40),     -- Roda Fixa 100mm
(15, 25),     -- Roda Giratória 125mm c/ Travão
(16, 850),    -- Parafuso M8x20
(17, 720),    -- Parafuso M8x30
(18, 450),    -- Parafuso M10x30
(19, 900),    -- Porca M8
(20, 400),    -- Porca M10
(21, 1200),   -- Anilha M8
(22, 35),     -- Pega 200mm
(23, 18),     -- Pega 300mm - abaixo do mínimo!
(24, 80);     -- Batente Borracha

-- ============================================
-- SERVIÇOS EXTERNOS
-- ============================================
INSERT INTO servicos_externos (nome, fornecedor_id, preco_estimado, tempo_estimado, notas) VALUES
('Zincagem', 5, 25.00, 3, 'Preço por kg. Mínimo 2 dias úteis para pequenas quantidades.'),
('Decapagem', 5, 15.00, 2, 'Preço por m². Necessário para peças com oxidação.'),
('Lacagem Branca', 6, 35.00, 4, 'Preço por m². RAL 9010.'),
('Lacagem Preta', 6, 35.00, 4, 'Preço por m². RAL 9005.'),
('Lacagem Cor Especial', 6, 45.00, 5, 'Preço por m². Cores RAL especiais.');

-- ============================================
-- ESTAÇÕES DE TRABALHO
-- ============================================
INSERT INTO estacoes (nome, ordem_default, cor, icone) VALUES
('Corte', 1, '#dc3545', 'fa-cut'),
('Solda/Montagem', 2, '#fd7e14', 'fa-fire'),
('Limpeza', 3, '#0dcaf0', 'fa-broom'),
('Acabamentos', 4, '#198754', 'fa-paint-brush');

-- ============================================
-- PRODUTOS
-- ============================================
INSERT INTO produtos (nome, sku, categoria_id, descricao, custo_estimado, tempo_estimado) VALUES
('Carrinho Transporte CT-200', 'CT-200', 1, 'Carrinho de transporte em inox com 4 rodas giratórias. Dimensões: 80x60x90cm. Capacidade: 200kg.', 185.00, 180),
('Carrinho Transporte CT-300', 'CT-300', 1, 'Carrinho de transporte em inox reforçado com 4 rodas giratórias 125mm. Dimensões: 100x70x95cm. Capacidade: 300kg.', 265.00, 240),
('Palete Alumínio PAL-100', 'PAL-100', 2, 'Palete em alumínio para transporte. Dimensões: 120x80cm. Capacidade: 1000kg.', 145.00, 120),
('Estrutura Base EB-01', 'EB-01', 6, 'Estrutura base em tubo inox para carrinhos. Semi-produto.', 45.00, 45);

-- ============================================
-- CONFIGURAÇÃO ESTAÇÕES POR PRODUTO
-- ============================================
-- Carrinho CT-200 usa todas as estações
INSERT INTO produto_estacoes (produto_id, estacao_id, ordem, obrigatoria, tempo_estimado) VALUES
(1, 1, 1, TRUE, 45),   -- Corte
(1, 2, 2, TRUE, 90),   -- Solda
(1, 3, 3, TRUE, 20),   -- Limpeza
(1, 4, 4, TRUE, 25);   -- Acabamentos

-- Carrinho CT-300 usa todas as estações
INSERT INTO produto_estacoes (produto_id, estacao_id, ordem, obrigatoria, tempo_estimado) VALUES
(2, 1, 1, TRUE, 60),
(2, 2, 2, TRUE, 120),
(2, 3, 3, TRUE, 25),
(2, 4, 4, TRUE, 35);

-- Palete não precisa de acabamentos
INSERT INTO produto_estacoes (produto_id, estacao_id, ordem, obrigatoria, tempo_estimado) VALUES
(3, 1, 1, TRUE, 40),
(3, 2, 2, TRUE, 60),
(3, 3, 3, TRUE, 20);

-- Estrutura Base - só corte e solda
INSERT INTO produto_estacoes (produto_id, estacao_id, ordem, obrigatoria, tempo_estimado) VALUES
(4, 1, 1, TRUE, 20),
(4, 2, 2, TRUE, 25);

-- ============================================
-- BOM - BILL OF MATERIALS
-- ============================================

-- BOM do Carrinho CT-200
INSERT INTO bom_linhas (produto_id, tipo, material_id, quantidade, unidade, tolerancia, notas) VALUES
(1, 'material', 1, 4.5, 'metros', 5, 'Tubo Inox 30mm para estrutura'),
(1, 'material', 7, 0.8, 'm2', 3, 'Chapa Inox 2mm para base'),
(1, 'material', 10, 2.0, 'metros', 5, 'Cantoneira para reforço'),
(1, 'material', 12, 4, 'unidades', 0, 'Rodas giratórias com travão'),
(1, 'material', 16, 16, 'unidades', 10, 'Parafusos M8x20'),
(1, 'material', 19, 16, 'unidades', 10, 'Porcas M8'),
(1, 'material', 21, 32, 'unidades', 10, 'Anilhas M8'),
(1, 'material', 22, 2, 'unidades', 0, 'Pegas para empurrar');

-- BOM do Carrinho CT-300 (usa Estrutura Base como sub-produto)
INSERT INTO bom_linhas (produto_id, tipo, material_id, quantidade, unidade, tolerancia, notas) VALUES
(2, 'material', 2, 6.0, 'metros', 5, 'Tubo Inox 40mm para estrutura superior'),
(2, 'material', 7, 1.2, 'm2', 3, 'Chapa Inox 2mm para base dupla'),
(2, 'material', 10, 3.0, 'metros', 5, 'Cantoneira para reforço');

INSERT INTO bom_linhas (produto_id, tipo, subproduto_id, quantidade, unidade, notas) VALUES
(2, 'subproduto', 4, 1, 'unidades', 'Estrutura base pré-fabricada');

INSERT INTO bom_linhas (produto_id, tipo, material_id, quantidade, unidade, tolerancia, notas) VALUES
(2, 'material', 15, 4, 'unidades', 0, 'Rodas giratórias 125mm com travão'),
(2, 'material', 17, 24, 'unidades', 10, 'Parafusos M8x30'),
(2, 'material', 19, 24, 'unidades', 10, 'Porcas M8'),
(2, 'material', 21, 48, 'unidades', 10, 'Anilhas M8'),
(2, 'material', 23, 2, 'unidades', 0, 'Pegas grandes 300mm');

-- BOM da Palete PAL-100
INSERT INTO bom_linhas (produto_id, tipo, material_id, quantidade, unidade, tolerancia, notas) VALUES
(3, 'material', 4, 8.0, 'metros', 5, 'Tubo Alumínio 30mm estrutura'),
(3, 'material', 5, 4.0, 'metros', 5, 'Tubo Alumínio 40mm travessas'),
(3, 'material', 8, 1.0, 'm2', 3, 'Chapa Alumínio 1mm piso'),
(3, 'material', 11, 2.5, 'metros', 5, 'Cantoneira para reforço');

-- BOM da Estrutura Base EB-01
INSERT INTO bom_linhas (produto_id, tipo, material_id, quantidade, unidade, tolerancia, notas) VALUES
(4, 'material', 1, 2.0, 'metros', 5, 'Tubo Inox 30mm base'),
(4, 'material', 10, 1.0, 'metros', 5, 'Cantoneira ligação'),
(4, 'material', 16, 8, 'unidades', 10, 'Parafusos'),
(4, 'material', 19, 8, 'unidades', 10, 'Porcas');

-- CT-200 com serviço de Zincagem opcional
INSERT INTO bom_linhas (produto_id, tipo, servico_id, quantidade, unidade, notas) VALUES
(1, 'servico_externo', 1, 1, 'servico', 'Zincagem opcional para ambientes agressivos');

-- ============================================
-- CLIENTES DE EXEMPLO
-- ============================================
INSERT INTO clientes (nome, contacto, email, telefone, morada) VALUES
('Padaria Central', 'José Padeiro', 'geral@padariacentral.pt', '253 100 100', 'Rua do Pão, 123, Braga'),
('Supermercado ABC', 'Ana Gestora', 'compras@superabc.pt', '224 200 200', 'Av. Principal, 456, Porto'),
('Armazéns Silva', 'Carlos Silva', 'carlos@armazenssilva.pt', '219 300 300', 'Zona Industrial, Lisboa');

-- ============================================
-- CONFIGURAÇÕES DO SISTEMA
-- ============================================
INSERT INTO config (chave, valor, descricao) VALUES
('horario_manha_inicio', '08:30', 'Início do turno da manhã'),
('horario_manha_fim', '12:30', 'Fim do turno da manhã'),
('horario_tarde_inicio', '13:30', 'Início do turno da tarde'),
('horario_tarde_fim', '17:30', 'Fim do turno da tarde'),
('dias_uteis', '1,2,3,4,5', 'Dias úteis (1=Segunda, 7=Domingo)'),
('empresa_nome', 'Mansilhas & Cia', 'Nome da empresa'),
('empresa_email', 'geral@mansilhas.pt', 'Email da empresa');

-- ============================================
-- ORDENS DE EXEMPLO (para testes)
-- ============================================
INSERT INTO ordens (numero, produto_id, quantidade, cliente_nome, data_prevista, prioridade, estado, notas) VALUES
('OP-2026-00001', 1, 5, 'Padaria Central', DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), 3, 'em_producao', 'Cliente precisa para inauguração'),
('OP-2026-00002', 3, 10, 'Armazéns Silva', DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 2, 'pendente', NULL),
('OP-2026-00003', 2, 2, 'Supermercado ABC', DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), 4, 'em_producao', 'URGENTE - Entrega sexta');

-- Estados das estações para OP-00001
INSERT INTO ordem_estacoes (ordem_id, estacao_id, ordem, estado, iniciado_em, concluido_em, tempo_real) VALUES
(1, 1, 1, 'concluido', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 220),
(1, 2, 2, 'em_progresso', DATE_SUB(NOW(), INTERVAL 4 HOUR), NULL, NULL),
(1, 3, 3, 'pendente', NULL, NULL, NULL),
(1, 4, 4, 'pendente', NULL, NULL, NULL);

-- Estados das estações para OP-00003
INSERT INTO ordem_estacoes (ordem_id, estacao_id, ordem, estado, iniciado_em) VALUES
(3, 1, 1, 'concluido', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 2, 2, 'concluido', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(3, 3, 3, 'em_progresso', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(3, 4, 4, 'pendente', NULL);

-- ============================================
-- ALERTAS DE EXEMPLO
-- ============================================
INSERT INTO alertas (tipo, mensagem, material_id) VALUES
('stock_baixo', 'Stock baixo: Pega Tubular Inox 300mm (18 un, mínimo: 20)', 23);
