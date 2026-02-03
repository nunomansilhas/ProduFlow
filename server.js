/**
 * ProduFlow - Servidor Principal
 * Sistema de Gestão de Produção Industrial
 * Mansilhas & Cia
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const db = require('./config/database');

// Importar rotas
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Parse JSON e form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ficheiros estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configurar sessões
app.use(session({
    secret: process.env.SESSION_SECRET || 'produflow_secret_key_change_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Middleware para disponibilizar user em todas as views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// ============================================
// ROTAS
// ============================================

// Rotas de autenticação
app.use('/auth', authRoutes);

// Rotas API
app.use('/api', apiRoutes);

// Rotas de views (páginas HTML)
app.use('/', viewRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

async function startServer() {
    // Testar conexão à BD
    const dbConnected = await db.testConnection();

    if (!dbConnected) {
        console.error('Não foi possível conectar à base de dados. Verifique as configurações.');
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log('');
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║                                                          ║');
        console.log('║   🏭 ProduFlow - Sistema de Gestão de Produção          ║');
        console.log('║                                                          ║');
        console.log(`║   Servidor: http://localhost:${PORT}                       ║`);
        console.log('║   Ambiente: ' + (process.env.NODE_ENV || 'development').padEnd(40) + '  ║');
        console.log('║                                                          ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        console.log('');
    });
}

startServer();
