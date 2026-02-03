/**
 * ProduFlow - Middleware de Autenticação
 */

// Verificar se utilizador está autenticado
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }

    // Se é pedido API, retornar erro JSON
    if (req.path.startsWith('/api')) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    // Caso contrário, redirecionar para login
    res.redirect('/login');
}

// Verificar se utilizador é admin
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }

    if (req.path.startsWith('/api')) {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    res.redirect('/dashboard');
}

// Verificar se utilizador é gestor ou admin
function isGestorOrAdmin(req, res, next) {
    if (req.session && req.session.user) {
        const role = req.session.user.role;
        if (role === 'admin' || role === 'gestor') {
            return next();
        }
    }

    if (req.path.startsWith('/api')) {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    res.redirect('/dashboard');
}

module.exports = {
    isAuthenticated,
    isAdmin,
    isGestorOrAdmin
};
