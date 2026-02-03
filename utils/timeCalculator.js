/**
 * ProduFlow - Calculadora de Tempo
 * Funções para cálculo de tempo real de trabalho (excluindo horas mortas)
 */

// Horário de trabalho (configurável)
const HORARIO_TRABALHO = {
    manha: { inicio: '08:30', fim: '12:30' },
    tarde: { inicio: '13:30', fim: '17:30' },
    diasUteis: [1, 2, 3, 4, 5] // Segunda a Sexta (0 = Domingo)
};

/**
 * Converte string de hora para minutos desde meia-noite
 */
function horaParaMinutos(horaStr) {
    const [horas, minutos] = horaStr.split(':').map(Number);
    return horas * 60 + minutos;
}

/**
 * Verifica se um dia é útil
 */
function ehDiaUtil(data) {
    return HORARIO_TRABALHO.diasUteis.includes(data.getDay());
}

/**
 * Obtém os períodos de trabalho de um dia (em minutos desde meia-noite)
 */
function getPeriodosTrabalho() {
    return [
        {
            inicio: horaParaMinutos(HORARIO_TRABALHO.manha.inicio),
            fim: horaParaMinutos(HORARIO_TRABALHO.manha.fim)
        },
        {
            inicio: horaParaMinutos(HORARIO_TRABALHO.tarde.inicio),
            fim: horaParaMinutos(HORARIO_TRABALHO.tarde.fim)
        }
    ];
}

/**
 * Calcula minutos de trabalho num determinado momento do dia
 */
function minutosNoHorario(minutosDoDia) {
    const periodos = getPeriodosTrabalho();

    for (const periodo of periodos) {
        if (minutosDoDia >= periodo.inicio && minutosDoDia <= periodo.fim) {
            return minutosDoDia;
        }
        if (minutosDoDia < periodo.inicio) {
            return periodo.inicio;
        }
    }

    // Após o último período
    return periodos[periodos.length - 1].fim;
}

/**
 * Calcula horas úteis entre duas datas
 * @param {Date} inicio - Data/hora de início
 * @param {Date} fim - Data/hora de fim
 * @returns {number} Minutos de trabalho efetivo
 */
function calcularTempoReal(inicio, fim) {
    if (!inicio || !fim) return 0;

    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);

    if (dataFim <= dataInicio) return 0;

    let totalMinutos = 0;
    const periodos = getPeriodosTrabalho();
    const minutosPorDia = periodos.reduce((acc, p) => acc + (p.fim - p.inicio), 0);

    // Iterar por cada dia
    let diaAtual = new Date(dataInicio);
    diaAtual.setHours(0, 0, 0, 0);

    const diaFinal = new Date(dataFim);
    diaFinal.setHours(0, 0, 0, 0);

    while (diaAtual <= diaFinal) {
        if (ehDiaUtil(diaAtual)) {
            const ehPrimeiroDia = diaAtual.getTime() === new Date(dataInicio).setHours(0, 0, 0, 0);
            const ehUltimoDia = diaAtual.getTime() === new Date(dataFim).setHours(0, 0, 0, 0);

            for (const periodo of periodos) {
                let inicioPeríodo = periodo.inicio;
                let fimPeriodo = periodo.fim;

                if (ehPrimeiroDia) {
                    const minutosInicio = dataInicio.getHours() * 60 + dataInicio.getMinutes();
                    if (minutosInicio > fimPeriodo) {
                        continue; // Este período já passou
                    }
                    inicioPeríodo = Math.max(inicioPeríodo, minutosInicio);
                }

                if (ehUltimoDia) {
                    const minutosFim = dataFim.getHours() * 60 + dataFim.getMinutes();
                    if (minutosFim < inicioPeríodo) {
                        continue; // Este período ainda não começou
                    }
                    fimPeriodo = Math.min(fimPeriodo, minutosFim);
                }

                if (fimPeriodo > inicioPeríodo) {
                    totalMinutos += fimPeriodo - inicioPeríodo;
                }
            }
        }

        // Próximo dia
        diaAtual.setDate(diaAtual.getDate() + 1);
    }

    return totalMinutos;
}

/**
 * Formata minutos em string legível
 * @param {number} minutos - Total de minutos
 * @returns {string} Formato "Xh Ym" ou "Xd Yh Zm"
 */
function formatarTempo(minutos) {
    if (minutos < 60) {
        return `${minutos}m`;
    }

    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    if (horas < 8) {
        return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
    }

    const dias = Math.floor(horas / 8);
    const horasRestantes = horas % 8;

    if (dias === 1 && horasRestantes === 0 && mins === 0) {
        return '1 dia';
    }

    let resultado = `${dias}d`;
    if (horasRestantes > 0) resultado += ` ${horasRestantes}h`;
    if (mins > 0) resultado += ` ${mins}m`;

    return resultado;
}

/**
 * Calcula data prevista de conclusão baseada em tempo estimado
 * @param {Date} inicio - Data de início
 * @param {number} minutosNecessarios - Tempo estimado em minutos
 * @returns {Date} Data prevista de conclusão
 */
function calcularDataConclusao(inicio, minutosNecessarios) {
    const dataInicio = new Date(inicio);
    const periodos = getPeriodosTrabalho();
    let minutosRestantes = minutosNecessarios;

    let dataAtual = new Date(dataInicio);

    while (minutosRestantes > 0) {
        if (ehDiaUtil(dataAtual)) {
            for (const periodo of periodos) {
                const minutosDisponiveis = periodo.fim - periodo.inicio;

                if (minutosRestantes <= minutosDisponiveis) {
                    // Conclusão neste período
                    const minutosInicio = periodo.inicio;
                    dataAtual.setHours(Math.floor((minutosInicio + minutosRestantes) / 60));
                    dataAtual.setMinutes((minutosInicio + minutosRestantes) % 60);
                    return dataAtual;
                }

                minutosRestantes -= minutosDisponiveis;
            }
        }

        // Próximo dia
        dataAtual.setDate(dataAtual.getDate() + 1);
        dataAtual.setHours(8, 30, 0, 0);

        // Proteção contra loop infinito (máximo 1 ano)
        if (dataAtual.getTime() - dataInicio.getTime() > 365 * 24 * 60 * 60 * 1000) {
            break;
        }
    }

    return dataAtual;
}

module.exports = {
    calcularTempoReal,
    formatarTempo,
    calcularDataConclusao,
    HORARIO_TRABALHO
};
