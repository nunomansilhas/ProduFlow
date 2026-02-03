/**
 * ProduFlow - Rotas de Views (Páginas HTML)
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const { isAuthenticated } = require('../middleware/auth');

// Diretório base das views
const viewsDir = path.join(__dirname, '..', 'views');

// Página de login (pública)
router.get('/login', (req, res) => {
    // Se já está autenticado, redirecionar para dashboard
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(viewsDir, 'auth', 'login.html'));
});

// Redirecionar raiz para dashboard ou login
router.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

// ============================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================

router.use(isAuthenticated);

// Dashboard
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(viewsDir, 'dashboard.html'));
});

// Categorias
router.get('/categorias', (req, res) => {
    res.sendFile(path.join(viewsDir, 'categorias', 'index.html'));
});

// Fornecedores
router.get('/fornecedores', (req, res) => {
    res.sendFile(path.join(viewsDir, 'fornecedores', 'index.html'));
});

// Matérias-Primas
router.get('/materias', (req, res) => {
    res.sendFile(path.join(viewsDir, 'materias', 'index.html'));
});

// Stock
router.get('/stock', (req, res) => {
    res.sendFile(path.join(viewsDir, 'stock', 'index.html'));
});

router.get('/stock/movimentos', (req, res) => {
    res.sendFile(path.join(viewsDir, 'stock', 'movimentos.html'));
});

// Produtos
router.get('/produtos', (req, res) => {
    res.sendFile(path.join(viewsDir, 'produtos', 'index.html'));
});

router.get('/produtos/:id/bom', (req, res) => {
    res.sendFile(path.join(viewsDir, 'produtos', 'bom.html'));
});

// Serviços Externos
router.get('/servicos', (req, res) => {
    res.sendFile(path.join(viewsDir, 'servicos', 'index.html'));
});

// Estações de Trabalho
router.get('/estacoes', (req, res) => {
    res.sendFile(path.join(viewsDir, 'estacoes', 'index.html'));
});

// Ordens de Produção
router.get('/ordens', (req, res) => {
    res.sendFile(path.join(viewsDir, 'ordens', 'index.html'));
});

router.get('/ordens/nova', (req, res) => {
    res.sendFile(path.join(viewsDir, 'ordens', 'nova.html'));
});

router.get('/ordens/:id', (req, res) => {
    res.sendFile(path.join(viewsDir, 'ordens', 'detalhes.html'));
});

module.exports = router;
