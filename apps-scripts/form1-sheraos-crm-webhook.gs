/**
 * SHERAOS CRM - Google Apps Script Webhook
 *
 * Planilha: "ENTRADA DE LEADS - FORM 1 SHERAOS"
 * URL: https://docs.google.com/spreadsheets/d/1puGTEk3azGaLs_uVCUiqFGV5zSraxiuFPJiJo6NOcDE/edit
 *
 * Envia cada lead novo pro CRM SHERAOS (nao Dros) na conta "sheraos-marketing".
 *
 * IMPORTANTE:
 * - URL do CRM = sheraos.com.br/crm (Sheraos), NAO drosagencia.com.br
 * - Trigger: rodar automaticamente a cada 5 minutos (nao onEdit, pra evitar pular linhas
 *   quando Meta Lead Ads / LeadsBridge/Zapier grava em batch)
 * - Idempotente: usa coluna "CRM Status" como flag — so envia linhas ainda nao processadas
 *
 * COMO INSTALAR:
 * 1. Abre a planilha no navegador
 * 2. Menu: Extensoes > Apps Script
 * 3. Apaga o codigo padrao e cola TODO este arquivo
 * 4. Salva (Ctrl+S) e da um nome ao projeto (ex: "Sheraos CRM Webhook")
 * 5. Executa 1x a funcao "testarConexao" no botao Play (Run) do topo
 *    - Autoriza os acessos (planilha + rede externa) quando pedir
 *    - Ver logs no menu "Ver > Log de execucao" — deve retornar "Status: 200"
 * 6. Cria trigger automatico:
 *    - Menu do relogio (esquerda) > + Adicionar acionador
 *    - Funcao: processarLeadsPendentes
 *    - Fonte do evento: Baseado em tempo
 *    - Tipo: Timer de minutos
 *    - Intervalo: A cada 5 minutos
 *    - Salvar
 * 7. Pronto. Novas linhas serao processadas em ate 5 min.
 */

const CRM_WEBHOOK_URL = 'https://sheraos.com.br/crm/api/webhooks/sheets/sheraos-marketing';
const STATUS_COL_NAME = 'CRM Status'; // coluna adicionada automaticamente pra tracking

/**
 * Processa todas as linhas ainda nao enviadas pro CRM.
 * Roda via trigger de tempo (cada 5 min).
 */
// Normaliza um nome de header: minuscula, sem acentos, so a-z0-9_
// Isso resolve "de_qual_serviço", "de_qual_servico", "De qual serviço?" e variacoes
// que o Meta Lead Ads possa gerar quando o campo tiver acentos ou pontuacao.
function normalizeHeader(h) {
  return String(h || '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')       // remove acentos (cedilha, til, etc.)
    .replace(/[^a-z0-9_]+/g, '_')                  // qualquer caractere nao-ASCII vira _
    .replace(/_+/g, '_')                           // colapsa multiplos _
    .replace(/^_|_$/g, '');                        // remove _ das pontas
}

function processarLeadsPendentes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return; // so header ou vazia

  const lastCol = sheet.getLastColumn();
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const rawHeaders = values[0].map(String);
  const headers = rawHeaders.map(normalizeHeader);
  Logger.log('Headers normalizados: ' + JSON.stringify(headers));

  // Descobre indices de cada coluna que precisamos (por nome — safe se planilha mudar ordem)
  const colIdx = {
    id: headers.indexOf('id'),
    created_time: headers.indexOf('created_time'),
    ad_name: headers.indexOf('ad_name'),
    adset_name: headers.indexOf('adset_name'),
    campaign_name: headers.indexOf('campaign_name'),
    form_name: headers.indexOf('form_name'),
    is_organic: headers.indexOf('is_organic'),
    platform: headers.indexOf('platform'),
    // Match tolerante: qualquer header comecando com "de_qual_servico" (bate em variacoes tipo
    // "de_qual_servico_voce_precisa", "de_qual_servico_deseja", etc. — dependendo do wording do form Meta).
    de_qual_servico: headers.findIndex(function(h) { return h.indexOf('de_qual_servico') === 0; }),
    nome_completo: headers.indexOf('nome_completo'),
    telefone: headers.indexOf('telefone'),
    lead_status: headers.indexOf('lead_status')
  };
  Logger.log('Indices resolvidos: ' + JSON.stringify(colIdx));

  // Adiciona coluna "CRM Status" se ainda nao existir (compara normalizado — "CRM Status" -> "crm_status")
  let statusColIdx = headers.indexOf(normalizeHeader(STATUS_COL_NAME));
  if (statusColIdx === -1) {
    statusColIdx = lastCol; // proxima coluna livre (0-indexed)
    sheet.getRange(1, statusColIdx + 1).setValue(STATUS_COL_NAME).setFontWeight('bold');
    Logger.log('Coluna "' + STATUS_COL_NAME + '" criada (pos ' + (statusColIdx + 1) + ')');
    // Nao processa nada nesta rodada — proxima rodada ja tera a coluna
    return;
  }

  const val = function(row, key) {
    const i = colIdx[key];
    return i >= 0 ? row[i] : '';
  };

  let processados = 0, sucessos = 0, falhas = 0;

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const currentStatus = String(row[statusColIdx] || '').trim();
    if (currentStatus && currentStatus.indexOf('ERRO') !== 0 && currentStatus.indexOf('EXCEPTION') !== 0) {
      // ja processado com sucesso (ou PENDING) — pula. So reenvia se status comeca com ERRO/EXCEPTION.
      if (currentStatus !== '') continue;
    }

    const telefone = val(row, 'telefone');
    const nome = val(row, 'nome_completo');
    if (!telefone && !nome) continue; // linha vazia — pula sem marcar

    // Marca como PENDING antes de enviar (evita duplicar se script crasha no meio)
    sheet.getRange(r + 1, statusColIdx + 1).setValue('PENDING ' + new Date().toISOString().slice(0, 16));
    SpreadsheetApp.flush();

    const platform = String(val(row, 'platform') || '').toLowerCase().trim();
    const isOrganic = String(val(row, 'is_organic') || '').toLowerCase().trim() === 'true';
    const servico = String(val(row, 'de_qual_servico') || '').trim();

    // Fonte
    let fonte = 'Meta Ads';
    if (platform === 'ig' || platform === 'instagram') {
      fonte = isOrganic ? 'Instagram' : 'Instagram Pago';
    } else if (platform === 'fb' || platform === 'facebook') {
      fonte = isOrganic ? 'Facebook' : 'Facebook Pago';
    }

    // Tags: sempre a tag do form + tag do servico escolhido
    const tags = ['form-sheraos'];
    if (servico) {
      // normaliza: minusculas + troca espacos/underscores por hifen, remove acentos
      const tagServico = servico.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[_\s]+/g, '-');
      tags.push(tagServico);
    }
    if (fonte) {
      tags.push(fonte.toLowerCase().replace(/ /g, '-'));
    }

    const payload = {
      name: nome,
      phone: telefone, // backend limpa "p:+55..." automaticamente
      source: fonte,
      source_detail: [
        val(row, 'campaign_name') && 'campaign=' + val(row, 'campaign_name'),
        val(row, 'adset_name') && 'adset=' + val(row, 'adset_name'),
        val(row, 'ad_name') && 'ad=' + val(row, 'ad_name'),
        servico && 'servico=' + servico,
        val(row, 'form_name') && 'form=' + val(row, 'form_name')
      ].filter(Boolean).join(' | '),
      tags: tags.join(','),
      // UTMs pra CAPI melhor EMQ e attribution
      utm_source: platform === 'ig' ? 'instagram' : platform === 'fb' ? 'facebook' : '',
      utm_medium: isOrganic ? 'organic' : 'paid',
      utm_campaign: val(row, 'campaign_name') || '',
      utm_content: val(row, 'ad_name') || ''
    };

    try {
      const resp = UrlFetchApp.fetch(CRM_WEBHOOK_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      const code = resp.getResponseCode();
      const now = new Date().toISOString().slice(0, 16);
      if (code >= 200 && code < 300) {
        sheet.getRange(r + 1, statusColIdx + 1).setValue('OK ' + code + ' [' + now + ']');
        sucessos++;
      } else {
        const body = resp.getContentText().substring(0, 80);
        sheet.getRange(r + 1, statusColIdx + 1).setValue('ERRO ' + code + ': ' + body);
        falhas++;
      }
    } catch (err) {
      sheet.getRange(r + 1, statusColIdx + 1).setValue('EXCEPTION: ' + String(err.message).substring(0, 80));
      falhas++;
    }
    processados++;
    Utilities.sleep(400); // throttle 400ms entre envios pra nao stressar backend
  }

  Logger.log('Processados: ' + processados + ' | Sucessos: ' + sucessos + ' | Falhas: ' + falhas);
}

/**
 * Testa autorizacao + conectividade com o CRM Sheraos.
 * Envia 1 lead teste com nome/telefone falsos. Rode 1x manualmente antes de ativar o trigger.
 * Depois de rodar, apague o lead teste no CRM se aparecer.
 */
function testarConexao() {
  const resp = UrlFetchApp.fetch(CRM_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      name: 'Teste Sheraos Webhook',
      phone: '5547999999999',
      source: 'Teste Apps Script',
      source_detail: 'teste de conexao inicial',
      tags: 'teste-webhook'
    }),
    muteHttpExceptions: true
  });
  Logger.log('Status: ' + resp.getResponseCode());
  Logger.log('Body: ' + resp.getContentText().substring(0, 400));
}

/**
 * Utilitario: apaga a coluna "CRM Status" (util pra reprocessar tudo do zero).
 * NAO rode a menos que queira reenviar todos os leads.
 */
function resetarStatusColumn() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(normalizeHeader);
  const idx = headers.indexOf(normalizeHeader(STATUS_COL_NAME));
  if (idx === -1) { Logger.log('Coluna CRM Status nao encontrada'); return; }
  sheet.deleteColumn(idx + 1);
  Logger.log('Coluna "' + STATUS_COL_NAME + '" removida. Proxima rodada recriara.');
}

/**
 * Reprocessa os leads que ja estao no CRM SEM tag de servico + SEM servico no source_detail —
 * util depois de corrigir o bug de header. Marca linhas afetadas como PENDING pra proxima rodada
 * do processarLeadsPendentes puxar de novo.
 *
 * Cuidado: o webhook do CRM cria lead novo se phone nao existe. Se o phone JA existe (leads
 * antigos), o backend atualiza os campos ao inves de duplicar (comportamento upsert por phone).
 */
/**
 * Debug: loga os headers exatos da planilha (raw + normalizados) pra decidir com que nome
 * o campo do servico esta indexado. Rode 1x e olhe "Ver > Registros de execucao".
 */
function debugHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastCol = sheet.getLastColumn();
  const raw = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  const norm = raw.map(normalizeHeader);
  Logger.log('=== HEADERS RAW ===');
  raw.forEach(function(h, i) { Logger.log((i+1) + ': "' + h + '"'); });
  Logger.log('=== HEADERS NORMALIZADOS ===');
  norm.forEach(function(h, i) { Logger.log((i+1) + ': "' + h + '"'); });
}

function reprocessarLeadsSemServico() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(normalizeHeader);
  const statusIdx = headers.indexOf(normalizeHeader(STATUS_COL_NAME));
  const servicoIdx = headers.findIndex(function(h) { return h.indexOf('de_qual_servico') === 0; });
  if (statusIdx === -1 || servicoIdx === -1) { Logger.log('Colunas necessarias nao encontradas (status=' + statusIdx + ', servico=' + servicoIdx + ')'); return; }

  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  let count = 0;
  for (let r = 0; r < values.length; r++) {
    const row = values[r];
    const status = String(row[statusIdx] || '');
    const servico = String(row[servicoIdx] || '').trim();
    // Se linha tem servico preenchido MAS foi enviada com sucesso ANTES do fix, marca vazio pra reenviar
    if (servico && status.indexOf('OK') === 0) {
      sheet.getRange(r + 2, statusIdx + 1).setValue('');
      count++;
    }
  }
  Logger.log('Marcados ' + count + ' leads pra reprocessamento na proxima rodada.');
}
