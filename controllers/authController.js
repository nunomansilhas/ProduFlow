/**
 * ProduFlow - Controller de Autenticação
 */

const bcrypt = require('bcrypt');
const db = require('../config/database');

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e password são obrigatórios' });
        }

        // Buscar utilizador
        const [users] = await db.query(
            'SELECT id, nome, email, password_hash, role FROM users WHERE email = ? AND ativo = TRUE',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = users[0];

        // Verificar password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Criar sessão
        req.session.user = {
            id: user.id,
            nome: user.nome,
            email: user.email,
            role: user.role
        };

        res.json({
            success: true,
            message: 'Login efectuado com sucesso',
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao efectuar login' });
    }
};

// Logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao fazer logout:', err);
            return res.status(500).json({ error: 'Erro ao fazer logout' });
        }
        res.json({ success: true, message: 'Logout efectuado com sucesso' });
    });
};

// Obter utilizador atual
exports.me = (req, res) => {
    if (req.session && req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Não autenticado' });
    }
};

// Alterar password
exports.alterarPassword = async (req, res) => {
    try {
        const { passwordAtual, novaPassword } = req.body;
        const userId = req.session.user.id;

        if (!passwordAtual || !novaPassword) {
            return res.status(400).json({ error: 'Passwords são obrigatórias' });
        }

        if (novaPassword.length < 6) {
            return res.status(400).json({ error: 'Nova password deve ter pelo menos 6 caracteres' });
        }

        // Buscar utilizador
        const [users] = await db.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilizador não encontrado' });
        }

        // Verificar password atual
        const validPassword = await bcrypt.compare(passwordAtual, users[0].password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Password atual incorrecta' });
        }

        // Hash nova password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(novaPassword, salt);

        // Atualizar
        await db.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, userId]
        );

        res.json({ success: true, message: 'Password alterada com sucesso' });

    } catch (error) {
        console.error('Erro ao alterar password:', error);
        res.status(500).json({ error: 'Erro ao alterar password' });
    }
};
