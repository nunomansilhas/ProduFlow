/**
 * ProduFlow - Rotas API
 * Todas as rotas REST da aplicação
 */

const express = require('express');
const router = express.Router();

// Middleware de autenticação
const { isAuthenticated } = require('../middleware/auth');

// Controllers
const categoriasController = require('../controllers/categoriasController');
const fornecedoresController = require('../controllers/fornecedoresController');
const materiasController = require('../controllers/materiasController');
const stockController = require('../controllers/stockController');
const produtosController = require('../controllers/produtosController');
const servicosController = require('../controllers/servicosController');
const bomController = require('../controllers/bomController');
const estacoesController = require('../controllers/estacoesController');
const ordensController = require('../controllers/ordensController');
const alertasController = require('../controllers/alertasController');
const dashboardController = require('../controllers/dashboardController');

// ============================================
// ROTAS PÚBLICAS (para displays sem login)
// ============================================
router.get('/display/estacoes', estacoesController.listar);
router.get('/display/estacoes/:id', estacoesController.obter);
router.get('/display/estacoes/:id/ordens', estacoesController.ordensNaEstacao);
router.post('/display/ordens/:id/avancar', ordensController.avancarEstacao);

// ============================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================
router.use(isAuthenticated);

// ============================================
// DASHBOARD
// ============================================
router.get('/dashboard/stats', dashboardController.stats);
router.get('/dashboard/ordens', dashboardController.ordensEmProducao);
router.get('/dashboard/alertas', dashboardController.alertasRecentes);
router.get('/dashboard/stock-problemas', dashboardController.stockProblemas);
router.get('/dashboard/estacoes', dashboardController.resumoEstacoes);

// ============================================
// CATEGORIAS
// ============================================
router.get('/categorias', categoriasController.listar);
router.get('/categorias/:id', categoriasController.obter);
router.post('/categorias', categoriasController.criar);
router.put('/categorias/:id', categoriasController.atualizar);
router.delete('/categorias/:id', categoriasController.eliminar);

// ============================================
// FORNECEDORES
// ============================================
router.get('/fornecedores', fornecedoresController.listar);
router.get('/fornecedores/:id', fornecedoresController.obter);
router.post('/fornecedores', fornecedoresController.criar);
router.put('/fornecedores/:id', fornecedoresController.atualizar);
router.delete('/fornecedores/:id', fornecedoresController.eliminar);

// ============================================
// MATÉRIAS-PRIMAS
// ============================================
router.get('/materias', materiasController.listar);
router.get('/materias/:id', materiasController.obter);
router.post('/materias', materiasController.criar);
router.put('/materias/:id', materiasController.atualizar);
router.delete('/materias/:id', materiasController.eliminar);

// ============================================
// STOCK
// ============================================
router.get('/stock', stockController.listar);
router.get('/stock/:materia_id', stockController.obter);
router.post('/stock/movimento', stockController.movimento);
router.post('/stock/ajuste', stockController.ajuste);
router.get('/stock/:materia_id/movimentos', stockController.movimentos);
router.get('/movimentos', stockController.todosMovimentos);

// ============================================
// PRODUTOS
// ============================================
router.get('/produtos', produtosController.listar);
router.get('/produtos/:id', produtosController.obter);
router.post('/produtos', produtosController.criar);
router.put('/produtos/:id', produtosController.atualizar);
router.delete('/produtos/:id', produtosController.eliminar);
router.put('/produtos/:id/estacoes', produtosController.atualizarEstacoes);
router.get('/produtos/:id/custo', produtosController.calcularCusto);

// ============================================
// BOM (Bill of Materials)
// ============================================
router.get('/produtos/:produto_id/bom', bomController.listar);
router.get('/produtos/:produto_id/bom/completa', bomController.bomCompleta);
router.get('/produtos/:produto_id/bom/materiais', bomController.calcularMateriais);
router.get('/bom/:id', bomController.obter);
router.post('/bom', bomController.criar);
router.put('/bom/:id', bomController.atualizar);
router.delete('/bom/:id', bomController.eliminar);

// ============================================
// SERVIÇOS EXTERNOS
// ============================================
router.get('/servicos', servicosController.listar);
router.get('/servicos/:id', servicosController.obter);
router.post('/servicos', servicosController.criar);
router.put('/servicos/:id', servicosController.atualizar);
router.delete('/servicos/:id', servicosController.eliminar);

// ============================================
// ESTAÇÕES DE TRABALHO
// ============================================
router.get('/estacoes', estacoesController.listar);
router.get('/estacoes/:id', estacoesController.obter);
router.post('/estacoes', estacoesController.criar);
router.put('/estacoes/:id', estacoesController.atualizar);
router.delete('/estacoes/:id', estacoesController.eliminar);
router.put('/estacoes/reordenar', estacoesController.reordenar);
router.get('/estacoes/:id/ordens', estacoesController.ordensNaEstacao);

// ============================================
// ORDENS DE PRODUÇÃO
// ============================================
router.get('/ordens', ordensController.listar);
router.get('/ordens/verificar-stock', ordensController.verificarStock);
router.get('/ordens/sugestoes-agrupamento', ordensController.sugestoesAgrupamento);
router.get('/ordens/:id', ordensController.obter);
router.post('/ordens', ordensController.criar);
router.post('/ordens/grupos', ordensController.criarGrupo);
router.put('/ordens/:id', ordensController.atualizar);
router.delete('/ordens/:id', ordensController.eliminar);
router.post('/ordens/:id/iniciar', ordensController.iniciarProducao);
router.post('/ordens/:id/avancar', ordensController.avancarEstacao);
router.post('/ordens/:id/saltar', ordensController.saltarEstacao);
router.put('/ordens/:id/servicos/:servicoId', ordensController.atualizarServico);
router.post('/ordens/:id/concluir', ordensController.concluirOrdemManual);

// ============================================
// AGRUPAMENTO E BATCHING
// ============================================
router.get('/estacoes/:estacao_id/materiais', ordensController.materiaisEstacao);

// ============================================
// ALERTAS
// ============================================
router.get('/alertas', alertasController.listar);
router.get('/alertas/nao-vistos', alertasController.naoVistos);
router.put('/alertas/:id/visto', alertasController.marcarVisto);
router.put('/alertas/marcar-todos', alertasController.marcarTodosVistos);
router.delete('/alertas/:id', alertasController.eliminar);
router.delete('/alertas/limpar-antigos', alertasController.limparAntigos);

module.exports = router;
