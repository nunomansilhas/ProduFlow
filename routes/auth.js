/**
 * ProduFlow - Rotas de Autenticação
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// Login
router.post('/login', authController.login);

// Logout
router.post('/logout', authController.logout);

// Utilizador atual
router.get('/me', isAuthenticated, authController.me);

// Alterar password
router.post('/alterar-password', isAuthenticated, authController.alterarPassword);

module.exports = router;
