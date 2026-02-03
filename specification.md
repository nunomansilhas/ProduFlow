# ProduFlow
## Sistema de Gestão de Produção - Mansilhas & Cia
### Especificação Técnica v0.2

**Data:** 3 de Fevereiro de 2026  
**Estado:** Revisto após feedback

---

## 1. Visão Geral

### 1.1 Objetivo
Sistema interno (intranet) para gestão de produção industrial:
- Definir produtos e BOMs (Bill of Materials)
- Gerir stock de matérias-primas
- Criar e acompanhar ordens de produção
- Mostrar tarefas em ecrãs nas linhas de produção
- Alertar quando materiais estão em falta
- Registar histórico para análise futura com AI

### 1.2 Utilizadores e Dispositivos
| Tipo | Acesso | Dispositivo |
|------|--------|-------------|
| Administrador/Gestor | Gestão total, dashboards | PC (browser) |
| Operador de Linha | Ver tarefas, confirmar | Raspberry Pi + ecrã (browser) |
| Receção/Armazém | Confirmar receção material | Tablet (browser) |

### 1.3 Princípios
- **Intranet-only:** Funciona na rede local, não precisa de internet
- **Sem autenticação nas linhas:** Operador só seleciona a estação
- **Modular:** Estações configuráveis, ordem ajustável
- **Simples:** Interfaces minimalistas para operadores

---

## 2. Módulos do Sistema

### 2.1 Catálogo de Produtos

**Campos:**
```
id
nome                  "Carrinho Transporte CT-200"
sku                   "CT-200"
categoria_id          → Categorias
descricao             texto livre
imagens[]             array de paths
custo_estimado        € (calculado ou manual)
tempo_estimado        minutos (produção total)
ativo                 boolean
created_at
updated_at
```

---

### 2.2 Fichas Técnicas (BOM)

**Estrutura exemplo:**
```
Produto: Carrinho CT-200
├── Tubo Inox 30mm: 4.5 metros
├── Chapa Inox 2mm: 0.8 m²
├── Cantoneira 40mm: 2 metros
├── Rodas Giratórias 100mm: 4 unidades
├── Parafusos M8: 16 unidades
├── [EXTERNO] Zincagem: 1 serviço        ← NOVO
└── Estrutura Base (sub-produto): 1 un   ← recursivo
```

**Campos BOM_Linha:**
```
id
produto_id            → Produtos
tipo                  "material" | "subproduto" | "servico_externo"
material_id           → Materias_Primas (se tipo=material)
subproduto_id         → Produtos (se tipo=subproduto)
servico_id            → Servicos_Externos (se tipo=servico_externo)
quantidade
unidade               metros | m² | unidades | litros | kg | servico
tolerancia            % desperdício esperado (ex: 5)
notas
```

**Serviços Externos (NOVO):**
```
id
nome                  "Zincagem", "Decapagem", "Lacagem"
fornecedor_id         → Fornecedores
preco_estimado        € por unidade/m²/kg
tempo_estimado        dias úteis
notas
```

Quando uma ordem tem serviço externo:
- Aparece na dashboard como "Aguarda Serviço Externo"
- Operador marca "Enviado para [Zincagem]"
- Quando regressa, marca "Recebido de [Zincagem]"
- Continua para próxima estação

---

### 2.3 Matérias-Primas

**Campos:**
```
id
nome                  "Tubo Inox AISI 304 - 30mm"
codigo                "TUB-INOX-30"
categoria_id          → Categorias
unidade               metros | m² | unidades | litros | kg
fornecedor_id         → Fornecedores (1 fornecedor principal)
stock_minimo          alerta quando abaixo
localizacao           "Prateleira A3"
preco_unitario        € (para cálculo de custos)
imagem
```

---

### 2.4 Stock

**Campos Stock:**
```
id
materia_id            → Materias_Primas
quantidade            atual
updated_at
```

**Movimentos de Stock:**
```
id
stock_id              → Stock
tipo                  "entrada" | "saida" | "ajuste"
quantidade            positivo ou negativo
ordem_id              → Ordens (se saída por produção)
motivo                texto (para ajustes: "Acerto inventário", "Sobra produção")
user_id               quem fez
created_at
```

**Acerto de Quantidades (stock negativo):**
- Dashboard mostra alerta "Stock Negativo" a vermelho
- Gestor vai a Stock → Ajustes → "Acertar Inventário"
- Insere quantidade real contada
- Sistema calcula diferença e regista movimento tipo "ajuste"

**Receção de Material:**
- Tablet no armazém mostra "Encomendas Pendentes"
- Material chega → funcionário seleciona encomenda
- Confirma quantidade recebida (pode diferir da encomendada)
- Sistema cria movimento "entrada"
- Se quantidade diferente, cria alerta

---

### 2.5 Estações de Trabalho

**Estações são configuráveis:**
```
id
nome                  "Corte", "Solda", "Limpeza", etc.
ordem_default         1, 2, 3, 4...
cor                   para identificação visual
icone                 Font Awesome
ativa                 boolean
```

**Estações default:**
1. Corte (Serra)
2. Solda/Montagem
3. Limpeza
4. Acabamentos

**Configuração por Produto (NOVO):**
Cada produto pode ter ordem de estações diferente:
```
produto_id
estacao_id
ordem                 override da ordem_default
obrigatoria           boolean (pode saltar?)
```

Exemplo: Produto simples pode saltar "Acabamentos".

---

### 2.6 Ordens de Produção

**Campos:**
```
id
numero                "OP-2026-00123" (auto-gerado)
produto_id            → Produtos
quantidade
cliente_id            → Clientes (opcional, para já só nome)
cliente_nome          texto (fallback)
data_entrada          automático
data_prevista         entrega esperada
prioridade            1=baixa, 2=normal, 3=alta, 4=urgente
estado                "pendente" | "em_producao" | "aguarda_externo" | "concluida"
notas
created_at
updated_at
```

**Estado por Estação:**
```
id
ordem_id              → Ordens
estacao_id            → Estacoes
estado                "pendente" | "em_progresso" | "concluido" | "saltado"
iniciado_em           timestamp
concluido_em          timestamp
tempo_real            minutos (calculado, exclui horas mortas)
notas
```

**Cálculo de Tempo Real:**
```
Horário de trabalho: 08:30-12:30 e 13:30-17:30
Horas úteis por dia: 8 horas

Se iniciado_em = 02/02 11:00
E concluido_em = 02/02 14:30

Tempo decorrido:
  11:00 → 12:30 = 1h30 (manhã)
  13:30 → 14:30 = 1h00 (tarde)
  Total: 2h30 de trabalho real

Ignora: 12:30-13:30 (almoço), noites, fins-de-semana
```

---

### 2.7 Interface das Linhas de Produção (Raspberry Pi)

**Ecrã simplificado:**
```
┌─────────────────────────────────────────────────────────┐
│  ● CORTE                              ProduFlow         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  OP-2026-00123                              [URGENTE]   │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  PRODUTO: Carrinho CT-200                               │
│  QUANTIDADE: 10 unidades                                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  MATERIAIS A CORTAR                             │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  • Tubo Inox 30mm         45 metros             │   │
│  │  • Chapa Inox 2mm         8 m²                  │   │
│  │  • Cantoneira 40mm        20 metros             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Notas: Cliente precisa até sexta                       │
│                                                         │
│  ┌─────────────┐              ┌─────────────────────┐   │
│  │   RECOLHA   │              │  CONCLUÍDO ✓        │   │
│  │   (entrego) │              │  (vêm buscar)       │   │
│  └─────────────┘              └─────────────────────┘   │
│                                                         │
│  Fila: mais 3 ordens                    [Trocar Linha]  │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Sem login - botão "Trocar Linha" para selecionar estação
- Mostra apenas: ID ordem, produto, quantidade, materiais relevantes, notas
- Dois botões de conclusão:
  - "Recolha" → operador leva à próxima estação
  - "Concluído" → próxima estação vem buscar
- Auto-refresh a cada X segundos
- Cores por prioridade (verde, amarelo, laranja, vermelho)

---

### 2.8 Dashboard (Gestor)

**Vista Principal:**
```
┌──────────────────────────────────────────────────────────────────┐
│  ProduFlow                                      Admin ▼   Sair   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │     12     │ │      3     │ │      1     │ │      2     │    │
│  │  Em Prod.  │ │  Urgentes  │ │  Atrasadas │ │ Aguarda    │    │
│  │            │ │            │ │    ⚠️      │ │  Externo   │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│                                                                  │
│  ALERTAS                                                         │
│  ──────────────────────────────────────────────────────────────  │
│  🔴 Stock Negativo: Tubo Inox 30mm (-12 metros)      [Acertar]  │
│  🟡 Stock Baixo: Rodas 100mm (4 un, mín: 20)         [Ver]      │
│  🟡 Material em falta para OP-00125                  [Ver]      │
│                                                                  │
│  ORDENS EM PRODUÇÃO                                              │
│  ──────────────────────────────────────────────────────────────  │
│  │ Ordem        │ Produto       │ Qty │ Estação    │ Prazo     │ │
│  ├──────────────┼───────────────┼─────┼────────────┼───────────┤ │
│  │ OP-00123     │ Carrinho CT   │ 10  │ ● Solda    │ 05/02     │ │
│  │ OP-00124     │ Palete AL-50  │ 5   │ ● Corte    │ 06/02     │ │
│  │ OP-00125     │ Contentor X   │ 2   │ ⏸ Aguarda │ 07/02  ⚠️ │ │
│  │ OP-00126     │ Rack Padaria  │ 8   │ ● Limpeza  │ 10/02     │ │
│                                                                  │
│  [+ Nova Ordem]                          [Ver Todas] [Filtros]   │
└──────────────────────────────────────────────────────────────────┘
```

**Métricas (futuro):**
- Tempo médio por estação
- Ordens concluídas esta semana
- Eficiência (tempo real vs estimado)

---

## 3. Fluxo Principal

```
                    ┌──────────────┐
                    │   ENCOMENDA  │
                    │   (cliente)  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ CRIAR ORDEM  │ ← Gestor no PC
                    │ DE PRODUÇÃO  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Calcula  │ │ Verifica │ │  Alerta  │
        │   BOM    │ │  Stock   │ │ se faltar│
        └──────────┘ └──────────┘ └──────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │      FILA DE PRODUÇÃO        │
            │   (ordenada por prioridade)  │
            └──────────────┬───────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
┌─────────┐          ┌─────────┐          ┌─────────┐
│  CORTE  │ ──────▶  │  SOLDA  │ ──────▶  │ LIMPEZA │ ──▶ ...
│  (RPi)  │          │  (RPi)  │          │  (RPi)  │
└─────────┘          └─────────┘          └─────────┘
     │                                          │
     │ (se serviço externo)                     │
     ▼                                          │
┌──────────────┐                                │
│   AGUARDA    │ ← Enviado para Zincagem        │
│   EXTERNO    │ → Recebido de Zincagem         │
└──────┬───────┘                                │
       └────────────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  CONCLUÍDA   │
                    │              │
                    │ • Desconta   │
                    │   stock      │
                    │ • Regista    │
                    │   tempos     │
                    └──────────────┘
```

---

## 4. Estrutura de Dados

### 4.1 Tabelas

```sql
-- Auxiliares
categorias (id, nome, tipo[produto|material])
fornecedores (id, nome, contacto, email, telefone)
clientes (id, nome, ...)  -- tabela existente
users (id, nome, email, password_hash, role[admin|gestor])

-- Core
produtos (id, nome, sku, categoria_id, descricao, custo_estimado, 
          tempo_estimado, ativo, created_at, updated_at)

materias_primas (id, nome, codigo, categoria_id, unidade, 
                 fornecedor_id, stock_minimo, localizacao, 
                 preco_unitario, imagem)

servicos_externos (id, nome, fornecedor_id, preco_estimado, 
                   tempo_estimado, notas)

stock (id, materia_id, quantidade, updated_at)

stock_movimentos (id, stock_id, tipo, quantidade, ordem_id, 
                  motivo, user_id, created_at)

-- BOM
bom_linhas (id, produto_id, tipo, material_id, subproduto_id, 
            servico_id, quantidade, unidade, tolerancia, notas)

-- Produção
estacoes (id, nome, ordem_default, cor, icone, ativa)

produto_estacoes (id, produto_id, estacao_id, ordem, obrigatoria)

ordens (id, numero, produto_id, quantidade, cliente_id, cliente_nome,
        data_entrada, data_prevista, prioridade, estado, notas, 
        created_at, updated_at)

ordem_estacoes (id, ordem_id, estacao_id, estado, iniciado_em, 
                concluido_em, tempo_real, notas)

ordem_materiais (id, ordem_id, material_id, quantidade_necessaria,
                 quantidade_usada, created_at)

-- Alertas
alertas (id, tipo, mensagem, ordem_id, material_id, visto, created_at)

-- Receção
encomendas_material (id, fornecedor_id, material_id, quantidade,
                     estado[pendente|recebida|parcial], data_prevista,
                     data_recebida, quantidade_recebida, user_id, notas)

-- Config
config (chave, valor)  -- horarios, etc.
```

---

## 5. Stack Tecnológica

### 5.1 Backend
```
Runtime:        Node.js + Express.js
Base de dados:  MySQL/MariaDB (com phpMyAdmin)
Queries:        mysql2 (queries diretas, sem ORM)
Auth:           bcrypt para hash passwords + sessões simples
```

### 5.2 Frontend (Admin)
```
Framework:      Vanilla JS
CSS:            Bootstrap 5 (ou Tailwind)
Tema:           Dark mode
Gráficos:       Chart.js (futuro)
```

### 5.3 Frontend (Linhas - Raspberry Pi)
```
Framework:      Vanilla JS (página simples)
CSS:            Bootstrap 5
Refresh:        Auto-refresh ou WebSockets
Touch:          Botões grandes, touch-friendly
```

### 5.4 Infraestrutura
```
Servidor:       Dedicado (~1000€), com GPU para AI futuro
Rede:           Ethernet em todos os dispositivos
Raspberry Pi:   Nas linhas de produção + armazém
Backup:         Automático diário (local + cloud opcional)
```

---

## 6. Fases de Desenvolvimento

### Fase 1 - Base (2-3 semanas)
- [ ] Setup projeto (Node.js, MySQL, estrutura)
- [ ] Auth básica (login admin, hash passwords)
- [ ] CRUD Categorias
- [ ] CRUD Fornecedores  
- [ ] CRUD Matérias-Primas
- [ ] CRUD Stock + Movimentos + Ajustes
- [ ] Interface admin (Bootstrap dark)

**Entregável:** Gerir matérias-primas e stock

---

### Fase 2 - Produtos (2 semanas)
- [ ] CRUD Produtos
- [ ] CRUD Serviços Externos
- [ ] CRUD BOM (com sub-produtos e serviços)
- [ ] Cálculo recursivo de materiais
- [ ] Cálculo de custo estimado

**Entregável:** Definir produtos completos com BOMs

---

### Fase 3 - Produção (2-3 semanas)
- [ ] CRUD Estações de Trabalho
- [ ] Configuração estações por produto
- [ ] CRUD Ordens de Produção
- [ ] Cálculo automático materiais (BOM × qty)
- [ ] Verificação stock + Alertas
- [ ] Estados por estação
- [ ] Fluxo de serviços externos

**Entregável:** Criar e gerir ordens de produção

---

### Fase 4 - Interfaces Operacionais (2 semanas)
- [ ] Ecrã linhas de produção (Raspberry Pi)
- [ ] Seleção de estação (sem login)
- [ ] Fila de trabalho por estação
- [ ] Botões Recolha/Concluído
- [ ] Auto-refresh
- [ ] Ecrã receção de material (tablet)

**Entregável:** Sistema funcional na fábrica

---

### Fase 5 - Dashboard e Métricas (1-2 semanas)
- [ ] Dashboard principal
- [ ] Alertas centralizados
- [ ] Vista de ordens em produção
- [ ] Cálculo tempo real (excluindo horas mortas)
- [ ] Métricas básicas

**Entregável:** Visão geral de produção

---

### Fase 6 - Refinamentos (ongoing)
- [ ] Relatórios de produção
- [ ] Histórico e estatísticas
- [ ] Otimizações de UX
- [ ] Integração AI (análise, orçamentos automáticos)

---

## 7. Configurações do Sistema

### 7.1 Horário de Trabalho
```javascript
const HORARIO = {
  manha: { inicio: "08:30", fim: "12:30" },
  tarde: { inicio: "13:30", fim: "17:30" },
  diasUteis: [1, 2, 3, 4, 5]  // Seg a Sex
};
```

### 7.2 Prioridades
```javascript
const PRIORIDADES = {
  1: { nome: "Baixa", cor: "#28a745" },      // verde
  2: { nome: "Normal", cor: "#ffc107" },     // amarelo
  3: { nome: "Alta", cor: "#fd7e14" },       // laranja
  4: { nome: "Urgente", cor: "#dc3545" }     // vermelho
};
```

### 7.3 Estados
```javascript
const ESTADOS_ORDEM = ["pendente", "em_producao", "aguarda_externo", "concluida"];
const ESTADOS_ESTACAO = ["pendente", "em_progresso", "concluido", "saltado"];
const TIPOS_MOVIMENTO = ["entrada", "saida", "ajuste"];
```

---

## 8. Questões Resolvidas ✓

| Questão | Decisão |
|---------|---------|
| Nome | ProduFlow |
| Auth tablets | Nenhuma, só seleção de estação |
| Impressão | Não necessário |
| Clientes | client_id + nome fallback |
| Custos | Sim, em produtos e materiais |
| Tempos | Sim, com horário de trabalho definido |
| Serviços externos | Novo módulo + estado "aguarda_externo" |
| Stock negativo | Alerta + função "Acertar Inventário" |
| Estações | Configuráveis, ordem ajustável por produto |

---

## 9. Próximos Passos

1. **Validar este documento** - OK para avançar?
2. **Setup inicial** - Criar estrutura do projeto
3. **Base de dados** - Criar schema MySQL
4. **Começar Fase 1** - CRUD básicos

---

*Documento pronto para desenvolvimento. Alguma alteração?*
