# 🏭 ProduFlow

Sistema de Gestão de Produção Industrial para a Mansilhas & Cia.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## 📋 Sobre

O ProduFlow é um sistema interno (intranet) desenvolvido para gerir todo o processo de produção industrial, desde a definição de produtos e matérias-primas até ao acompanhamento em tempo real nas linhas de produção.

### Funcionalidades Principais

- **📦 Catálogo de Produtos** - Gestão de produtos fabricados com fichas técnicas completas
- **🧾 Bill of Materials (BOM)** - Definição de "receitas" com materiais, sub-produtos e serviços externos
- **📊 Gestão de Stock** - Controlo de matérias-primas com alertas automáticos
- **🔧 Ordens de Produção** - Criação e acompanhamento de encomendas
- **🖥️ Ecrãs de Linha** - Interface para Raspberry Pi nas estações de trabalho
- **📈 Dashboard** - Visão geral da produção e métricas

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        SERVIDOR                             │
│                   (Node.js + Express)                       │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Admin     │  │   Linhas    │  │   Armazém   │         │
│  │   (PC)      │  │   (RPi)     │  │  (Tablet)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                    ┌─────────────┐                          │
│                    │   MySQL     │                          │
│                    │  Database   │                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

| Componente | Tecnologia |
|------------|------------|
| Backend | Node.js + Express.js |
| Base de Dados | MySQL/MariaDB |
| Frontend | Vanilla JavaScript |
| CSS Framework | Bootstrap 5 (Dark Theme) |
| Autenticação | bcrypt + express-session |
| Ícones | Font Awesome 6 |

---

## 📁 Estrutura do Projeto

```
produflow/
├── config/
│   └── database.js          # Conexão MySQL
├── controllers/             # Lógica de negócio
├── middleware/
│   └── auth.js              # Autenticação
├── public/
│   ├── css/                 # Estilos customizados
│   ├── js/                  # Scripts frontend
│   └── img/                 # Imagens e uploads
├── routes/
│   ├── api.js               # Rotas REST API
│   └── views.js             # Rotas páginas HTML
├── views/                   # Templates HTML
├── database/
│   ├── schema.sql           # Estrutura BD
│   └── seeds.sql            # Dados exemplo
├── utils/                   # Funções auxiliares
├── server.js                # Entry point
└── package.json
```

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- MySQL 8.0+ ou MariaDB 10.5+
- Git

### Passos

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/mansilhas/produflow.git
   cd produflow
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar ambiente**
   ```bash
   cp .env.example .env
   # Editar .env com as credenciais da BD
   ```

4. **Criar base de dados**
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p produflow < database/seeds.sql
   ```

5. **Iniciar o servidor**
   ```bash
   # Desenvolvimento
   npm run dev
   
   # Produção
   npm start
   ```

6. **Aceder ao sistema**
   ```
   http://localhost:3000
   ```

---

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# Base de Dados
DB_HOST=localhost
DB_USER=produflow
DB_PASSWORD=password_segura
DB_NAME=produflow

# Servidor
PORT=3000
SESSION_SECRET=string_secreta_muito_longa

# Ambiente
NODE_ENV=development
```

### Horário de Trabalho

O sistema considera o horário de trabalho para cálculo de tempos de produção:

- **Manhã:** 08:30 - 12:30
- **Tarde:** 13:30 - 17:30
- **Dias úteis:** Segunda a Sexta

---

## 📖 Documentação

- **[SPECIFICATION.md](./SPECIFICATION.md)** - Especificação técnica completa
- **[API.md](./docs/API.md)** - Documentação da API REST (em construção)

---

## 🔄 Fluxo de Produção

```
Encomenda → Ordem de Produção → Verificação Stock
                                      ↓
                              [Alerta se faltar]
                                      ↓
              ┌─────────────────────────────────────┐
              │         LINHAS DE PRODUÇÃO          │
              │                                     │
              │  Corte → Solda → Limpeza → Acab.   │
              │   ↓        ↓        ↓        ↓     │
              │  [RPi]   [RPi]   [RPi]    [RPi]    │
              └─────────────────────────────────────┘
                                      ↓
                              Ordem Concluída
                              (desconta stock)
```

---

## 🗄️ Módulos

### Implementados ✅

- [ ] Autenticação (login/logout)
- [ ] Gestão de Categorias
- [ ] Gestão de Fornecedores
- [ ] Gestão de Matérias-Primas
- [ ] Gestão de Stock e Movimentos
- [ ] Gestão de Produtos
- [ ] Bill of Materials (BOM)
- [ ] Serviços Externos
- [ ] Estações de Trabalho
- [ ] Ordens de Produção
- [ ] Dashboard

### Planeados 📋

- [ ] Interface para linhas (Raspberry Pi)
- [ ] Receção de material (Armazém)
- [ ] Relatórios e estatísticas
- [ ] Integração AI para orçamentos
- [ ] App mobile (PWA)

---

## 🖥️ Screenshots

> Em construção

---

## 🧪 Desenvolvimento

### Scripts disponíveis

```bash
npm start        # Inicia em produção
npm run dev      # Inicia com nodemon (hot reload)
npm run db:reset # Recria BD com seeds
npm run lint     # Verifica código
```

### Convenções de código

- **Commits:** Conventional Commits (feat:, fix:, docs:, etc.)
- **Branches:** feature/, bugfix/, hotfix/
- **Código:** ESLint + Prettier

---

## 📄 Licença

Software proprietário - Mansilhas & Cia © 2026

Todos os direitos reservados. Este software foi desenvolvido exclusivamente para uso interno da Mansilhas & Cia e não pode ser distribuído, copiado ou modificado sem autorização expressa.

---

## 👥 Equipa

- **Desenvolvimento:** Nuno
- **Especificação:** Nuno + Claude (Anthropic)

---

## 📞 Suporte

Para questões ou problemas:
- Criar issue no repositório
- Contactar equipa de desenvolvimento

---

<p align="center">
  <strong>ProduFlow</strong> - Gestão de Produção Industrial<br>
  Mansilhas & Cia © 2026
</p>
