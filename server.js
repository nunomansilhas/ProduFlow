/**
 * ProduFlow - Servidor Principal
 * Sistema de Gestão de Produção Industrial
 * Mansilhas & Cia
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');

const db = require('./config/database');

// Importar rotas
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Exportar io para uso em outros módulos
module.exports = { io };

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
// SOCKET.IO - WEBSOCKETS
// ============================================

// Armazenar conexões por estação
const stationConnections = new Map();

io.on('connection', (socket) => {
    console.log(`📡 Cliente conectado: ${socket.id}`);

    // Cliente junta-se a uma sala de estação
    socket.on('join-station', (stationId) => {
        socket.join(`station-${stationId}`);
        console.log(`📺 Display conectado à estação ${stationId}`);

        // Guardar referência
        if (!stationConnections.has(stationId)) {
            stationConnections.set(stationId, new Set());
        }
        stationConnections.get(stationId).add(socket.id);
    });

    // Cliente junta-se à sala do dashboard
    socket.on('join-dashboard', () => {
        socket.join('dashboard');
        console.log(`📊 Dashboard conectado: ${socket.id}`);
    });

    // Desconexão
    socket.on('disconnect', () => {
        console.log(`📡 Cliente desconectado: ${socket.id}`);

        // Limpar referências
        stationConnections.forEach((sockets, stationId) => {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                stationConnections.delete(stationId);
            }
        });
    });
});

// Função para emitir eventos (será usada pelos controllers)
app.set('io', io);
app.set('emitToStation', (stationId, event, data) => {
    io.to(`station-${stationId}`).emit(event, data);
});
app.set('emitToAllStations', (event, data) => {
    stationConnections.forEach((_, stationId) => {
        io.to(`station-${stationId}`).emit(event, data);
    });
});
app.set('emitToDashboard', (event, data) => {
    io.to('dashboard').emit(event, data);
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
// FUNÇÕES AUXILIARES
// ============================================

// Obter IP local da máquina
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Ignorar endereços internos e IPv6
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

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

    const localIP = getLocalIP();

    server.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║                                                              ║');
        console.log('║   🏭 ProduFlow - Sistema de Gestão de Produção              ║');
        console.log('║                                                              ║');
        console.log(`║   Local:    http://localhost:${PORT}                           ║`);
        console.log(`║   Rede:     http://${localIP}:${PORT}                        ║`.slice(0, 67) + '║');
        console.log('║                                                              ║');
        console.log('║   📡 WebSocket ativo                                         ║');
        console.log('║   📱 Acede pela rede para usar no telemóvel/tablet          ║');
        console.log('║                                                              ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');
    });
}

startServer();
