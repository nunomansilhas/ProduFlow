/**
 * ProduFlow - JavaScript Global
 * Funções utilitárias usadas em todas as páginas
 */

// ============================================
// CONFIGURAÇÃO
// ============================================

const API_BASE = '/api';

// Prioridades
const PRIORIDADES = {
    1: { nome: 'Baixa', cor: '#198754', classe: 'success' },
    2: { nome: 'Normal', cor: '#ffc107', classe: 'warning' },
    3: { nome: 'Alta', cor: '#fd7e14', classe: 'orange' },
    4: { nome: 'Urgente', cor: '#dc3545', classe: 'danger' }
};

// Estados de ordem
const ESTADOS_ORDEM = {
    pendente: { nome: 'Pendente', classe: 'secondary' },
    em_producao: { nome: 'Em Produção', classe: 'info' },
    aguarda_externo: { nome: 'Aguarda Externo', classe: 'warning' },
    concluida: { nome: 'Concluída', classe: 'success' }
};

// Estados de estação
const ESTADOS_ESTACAO = {
    pendente: { nome: 'Pendente', classe: 'secondary' },
    em_progresso: { nome: 'Em Progresso', classe: 'info' },
    concluido: { nome: 'Concluído', classe: 'success' },
    saltado: { nome: 'Saltado', classe: 'dark' }
};

// ============================================
// FUNÇÕES DE API
// ============================================

/**
 * Fazer pedido à API
 */
async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('/') ? endpoint : `${API_BASE}/${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const config = { ...defaultOptions, ...options };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);

        // Se não autenticado, redirecionar para login
        if (response.status === 401) {
            window.location.href = '/login';
            return null;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro na operação');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Atalhos para métodos HTTP
const api = {
    get: (endpoint) => apiRequest(endpoint),
    post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
    put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body }),
    delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
};

// ============================================
// NOTIFICAÇÕES (Toast)
// ============================================

/**
 * Mostrar toast de sucesso
 */
function mostrarSucesso(mensagem) {
    mostrarToast(mensagem, 'success');
}

/**
 * Mostrar toast de erro
 */
function mostrarErro(mensagem) {
    mostrarToast(mensagem, 'danger');
}

/**
 * Mostrar toast de aviso
 */
function mostrarAviso(mensagem) {
    mostrarToast(mensagem, 'warning');
}

/**
 * Mostrar toast genérico
 */
function mostrarToast(mensagem, tipo = 'info') {
    // Criar container se não existir
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Criar toast
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-bg-${tipo} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${mensagem}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 4000 });
    toast.show();

    // Remover do DOM após fechar
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// ============================================
// MODAIS
// ============================================

/**
 * Abrir modal
 */
function abrirModal(modalId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

/**
 * Fechar modal
 */
function fecharModal(modalId) {
    const modalElement = document.getElementById(modalId);
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
}

/**
 * Limpar formulário dentro de modal
 */
function limparFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        // Limpar campos hidden
        form.querySelectorAll('input[type="hidden"]').forEach(input => {
            if (input.name !== '_method') {
                input.value = '';
            }
        });
    }
}

// ============================================
// CONFIRMAÇÃO
// ============================================

/**
 * Mostrar diálogo de confirmação
 */
function confirmar(mensagem, titulo = 'Confirmar') {
    return new Promise((resolve) => {
        // Criar modal de confirmação se não existir
        let modal = document.getElementById('modal-confirmar');
        if (!modal) {
            const modalHtml = `
                <div class="modal fade" id="modal-confirmar" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content bg-dark">
                            <div class="modal-header">
                                <h5 class="modal-title" id="modal-confirmar-titulo"></h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body" id="modal-confirmar-mensagem"></div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="btn-confirmar-cancelar">Cancelar</button>
                                <button type="button" class="btn btn-danger" id="btn-confirmar-ok">Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('modal-confirmar');
        }

        document.getElementById('modal-confirmar-titulo').textContent = titulo;
        document.getElementById('modal-confirmar-mensagem').textContent = mensagem;

        const bsModal = new bootstrap.Modal(modal);

        const btnOk = document.getElementById('btn-confirmar-ok');
        const btnCancelar = document.getElementById('btn-confirmar-cancelar');

        const handleOk = () => {
            bsModal.hide();
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            btnOk.removeEventListener('click', handleOk);
            modal.removeEventListener('hidden.bs.modal', handleCancel);
        };

        btnOk.addEventListener('click', handleOk);
        modal.addEventListener('hidden.bs.modal', handleCancel);

        bsModal.show();
    });
}

// ============================================
// FORMATAÇÃO
// ============================================

/**
 * Formatar data para exibição
 */
function formatarData(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-PT');
}

/**
 * Formatar data e hora para exibição
 */
function formatarDataHora(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleString('pt-PT');
}

/**
 * Formatar valor monetário
 */
function formatarMoeda(valor) {
    if (valor === null || valor === undefined) return '-';
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
    }).format(valor);
}

/**
 * Formatar número com decimais
 */
function formatarNumero(valor, decimais = 2) {
    if (valor === null || valor === undefined) return '-';
    return new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais
    }).format(valor);
}

// ============================================
// BADGES E ESTADOS
// ============================================

/**
 * Gerar badge de prioridade
 */
function badgePrioridade(prioridade) {
    const p = PRIORIDADES[prioridade] || PRIORIDADES[2];
    return `<span class="badge bg-${p.classe}">${p.nome}</span>`;
}

/**
 * Gerar badge de estado de ordem
 */
function badgeEstadoOrdem(estado) {
    const e = ESTADOS_ORDEM[estado] || ESTADOS_ORDEM.pendente;
    return `<span class="badge bg-${e.classe}">${e.nome}</span>`;
}

/**
 * Gerar badge de estado de estação
 */
function badgeEstadoEstacao(estado) {
    const e = ESTADOS_ESTACAO[estado] || ESTADOS_ESTACAO.pendente;
    return `<span class="badge bg-${e.classe}">${e.nome}</span>`;
}

// ============================================
// LOADING
// ============================================

/**
 * Mostrar overlay de loading
 */
function mostrarLoading() {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        const html = `
            <div id="loading-overlay" class="loading-overlay">
                <div class="spinner-border spinner-large text-primary" role="status">
                    <span class="visually-hidden">A carregar...</span>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    } else {
        overlay.style.display = 'flex';
    }
}

/**
 * Esconder overlay de loading
 */
function esconderLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// ============================================
// SIDEBAR
// ============================================

/**
 * Marcar item ativo no sidebar
 */
function marcarMenuAtivo() {
    const path = window.location.pathname;
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
    });
}

// ============================================
// ALERTAS DO SISTEMA
// ============================================

/**
 * Carregar contagem de alertas não vistos
 */
async function carregarContagemAlertas() {
    try {
        const alertas = await api.get('/alertas/nao-vistos');
        const badge = document.getElementById('alertas-badge');
        if (badge) {
            badge.textContent = alertas.count || 0;
            badge.style.display = alertas.count > 0 ? 'inline' : 'none';
        }
    } catch (error) {
        console.error('Erro ao carregar alertas:', error);
    }
}

// ============================================
// LOGOUT
// ============================================

/**
 * Fazer logout
 */
async function logout() {
    try {
        await api.post('/auth/logout');
        window.location.href = '/login';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        window.location.href = '/login';
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Marcar menu ativo
    marcarMenuAtivo();

    // Carregar contagem de alertas (se não estiver na página de login)
    if (!window.location.pathname.includes('/login')) {
        carregarContagemAlertas();
        // Atualizar a cada 30 segundos
        setInterval(carregarContagemAlertas, 30000);
    }

    // Toggle sidebar em mobile
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('show');
        });
    }
});
