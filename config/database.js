/**
 * ProduFlow - Configuração da Base de Dados
 * Pool de conexões MySQL
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Criar pool de conexões
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'produflow',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'produflow',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Testar conexão
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✓ Conexão MySQL estabelecida');
        connection.release();
        return true;
    } catch (error) {
        console.error('✗ Erro ao conectar ao MySQL:', error.message);
        return false;
    }
}

module.exports = pool;
module.exports.testConnection = testConnection;
