/**
 * SHERAOS CRM - Google Apps Script Webhook v2
 *
 * Planilha: "ENTRADA DE LEADS - FORM 1 SHERAOS"
 * URL: https://docs.google.com/spreadsheets/d/1puGTEk3azGaLs_uVCUiqFGV5zSraxiuFPJiJo6NOcDE/edit
 *
 * Envia leads pro CRM SHERAOS a partir de DUAS abas:
 *  1. Aba principal (ENTRADA DE LEADS) - leads do Meta Lead Ads
 *  2. Aba LEADS LANDING PAGES         - leads das 5 LPs (trafego, assessoria, sites, crm-ia, posicionamento)
 *
 * IMPORTANTE:
 * - URL do CRM = sheraos.com.br/crm (Sheraos), NAO drosagencia.com.br
 * - Trigger: rodar automaticamente a cada 5 minutos
 * - Idempotente: usa coluna "CRM Status" (aba Meta) ou "crm_status" (aba LP) como flag
 *
 * COMO INSTALAR / ATUALIZAR:
 * 1. Abre a planilha no navegador
 * 2. Menu: Extensoes > Apps Script
 * 3. Apaga o codigo antigo do Codigo.gs e cola TODO este arquivo
 * 4. Salva (Ctrl+S)
 * 5. Rode "testarConexao" 1x pra confirmar (pode pedir autorizacao)
 * 6. Trigger existente pra "processarLeadsPendentes" ja funciona
 *    Se nao existe: menu do relogio > + Adicionar acionador
 *      - Funcao: processarLeadsPendentes
 *      - Baseado em tempo > Timer de minutos > A cada 5 minutos
 */

const CRM_WEBHOOK_URL = 'https://sheraos.com.br/crm/api/webhooks/sheets/sheraos-marketing';
const STATUS_COL_NAME = 'CRM Status';
const STATUS_COL_LP   = 'crm_status';
const ABA_LP          = 'LEADS LANDING PAGES';

// ============================================================
// FUNCAO PRINCIPAL - roda via trigger a cada 5 min
// ============================================================
function processarLeadsPendentes() {
  var totalMeta = processarAbaMetaAds();
  var totalLP   = processarAbaLPs();
  Logger.log('=== Total processado ===');
  Logger.log('Meta Ads: ' + totalMeta);
  Logger.log('LPs: ' + totalLP);
}

// ============================================================
// UTIL: normaliza header
// ============================================================
function normalizeHeader(h) {
  return String(h || '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// ============================================================
// ABA 1 - Meta Lead Ads (aba principal / primeira sheet)
// ============================================================
function processarAbaMetaAds() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const lastCol = sheet.getLastColumn();
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const rawHeaders = values[0].map(String);
  const headers = rawHeaders.map(normalizeHeader);

  const colIdx = {
    id: headers.indexOf('id'),
    created_time: headers.indexOf('created_time'),
    ad_name: headers.indexOf('ad_name'),
    adset_name: headers.indexOf('adset_name'),
    campaign_name: headers.indexOf('campaign_name'),
    form_name: headers.indexOf('form_name'),
    is_organic: headers.indexOf('is_organic'),
    platform: headers.indexOf('platform'),
    de_qual_servico: headers.findIndex(function(h) { return h.indexOf('de_qual_servico') === 0; }),
    nome_completo: headers.indexOf('nome_completo'),
    telefone: headers.indexOf('telefone'),
    lead_status: headers.indexOf('lead_status')
  };

  let statusColIdx = headers.indexOf(normalizeHeader(STATUS_COL_NAME));
  if (statusColIdx === -1) {
    statusColIdx = lastCol;
    sheet.getRange(1, statusColIdx + 1).setValue(STATUS_COL_NAME).setFontWeight('bold');
    Logger.log('Meta Ads: coluna CRM Status criada, processa na proxima rodada');
    return 0;
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
      if (currentStatus !== '') continue;
    }

    const telefone = val(row, 'telefone');
    const nome = val(row, 'nome_completo');
    if (!telefone && !nome) continue;

    sheet.getRange(r + 1, statusColIdx + 1).setValue('PENDING ' + new Date().toISOString().slice(0, 16));
    SpreadsheetApp.flush();

    const platform = String(val(row, 'platform') || '').toLowerCase().trim();
    const isOrganic = String(val(row, 'is_organic') || '').toLowerCase().trim() === 'true';
    const servico = String(val(row, 'de_qual_servico') || '').trim();

    let fonte = 'Meta Ads';
    if (platform === 'ig' || platform === 'instagram') fonte = isOrganic ? 'Instagram' : 'Instagram Pago';
    else if (platform === 'fb' || platform === 'facebook') fonte = isOrganic ? 'Facebook' : 'Facebook Pago';

    const tags = ['form-sheraos'];
    if (servico) {
      const tagServico = servico.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[_\s]+/g, '-');
      tags.push(tagServico);
    }
    if (fonte) tags.push(fonte.toLowerCase().replace(/ /g, '-'));

    const payload = {
      name: nome,
      phone: telefone,
      source: fonte,
      source_detail: [
        val(row, 'campaign_name') && 'campaign=' + val(row, 'campaign_name'),
        val(row, 'adset_name') && 'adset=' + val(row, 'adset_name'),
        val(row, 'ad_name') && 'ad=' + val(row, 'ad_name'),
        servico && 'servico=' + servico,
        val(row, 'form_name') && 'form=' + val(row, 'form_name')
      ].filter(Boolean).join(' | '),
      tags: tags.join(','),
      utm_source: platform === 'ig' ? 'instagram' : platform === 'fb' ? 'facebook' : '',
      utm_medium: isOrganic ? 'organic' : 'paid',
      utm_campaign: val(row, 'campaign_name') || '',
      utm_content: val(row, 'ad_name') || ''
    };

    const result = enviarParaCRM(payload);
    const now = new Date().toISOString().slice(0, 16);
    sheet.getRange(r + 1, statusColIdx + 1).setValue(result.ok ? 'OK ' + result.code + ' [' + now + ']' : 'ERRO ' + result.code + ': ' + result.body.substring(0, 60));
    if (result.ok) sucessos++; else falhas++;
    processados++;
    Utilities.sleep(400);
  }

  Logger.log('Meta Ads - Processados: ' + processados + ' | Sucessos: ' + sucessos + ' | Falhas: ' + falhas);
  return processados;
}

// ============================================================
// ABA 2 - LEADS LANDING PAGES (das 5 LPs do site)
// ============================================================
function processarAbaLPs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ABA_LP);
  if (!sheet) {
    Logger.log('Aba "' + ABA_LP + '" nao encontrada, pulando');
    return 0;
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const lastCol = sheet.getLastColumn();
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(String).map(normalizeHeader);

  const col = {
    timestamp: headers.indexOf('timestamp'),
    lp_origem: headers.indexOf('lp_origem'),
    nome: headers.indexOf('nome'),
    whatsapp: headers.indexOf('whatsapp'),
    empresa: headers.indexOf('empresa'),
    cidade: headers.indexOf('cidade'),
    faturamento: headers.indexOf('faturamento'),
    investimento_ads: headers.indexOf('investimento_ads'),
    agencia_atual: headers.indexOf('agencia_atual'),
    veio_de_anuncio: headers.indexOf('veio_de_anuncio'),
    utm_source: headers.indexOf('utm_source'),
    utm_medium: headers.indexOf('utm_medium'),
    utm_campaign: headers.indexOf('utm_campaign'),
    utm_content: headers.indexOf('utm_content'),
    utm_term: headers.indexOf('utm_term'),
    gclid: headers.indexOf('gclid'),
    fbclid: headers.indexOf('fbclid'),
    referrer: headers.indexOf('referrer'),
    status_qualif: headers.indexOf('status_qualif'),
    crm_status: headers.indexOf(STATUS_COL_LP)
  };

  if (col.crm_status === -1) {
    Logger.log('Aba LP: coluna crm_status nao encontrada. Verifique headers.');
    return 0;
  }

  const val = function(row, key) {
    const i = col[key];
    return i >= 0 ? String(row[i] || '').trim() : '';
  };

  let processados = 0, sucessos = 0, falhas = 0;

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const currentStatus = String(row[col.crm_status] || '').trim();
    if (currentStatus && currentStatus.indexOf('ERRO') !== 0 && currentStatus.indexOf('EXCEPTION') !== 0) {
      if (currentStatus !== '') continue;
    }

    const nome = val(row, 'nome');
    const wpp = limparWhatsapp(val(row, 'whatsapp'));
    if (!nome && !wpp) continue;

    sheet.getRange(r + 1, col.crm_status + 1).setValue('PENDING ' + new Date().toISOString().slice(0, 16));
    SpreadsheetApp.flush();

    const lpOrigem     = val(row, 'lp_origem');
    const empresa      = val(row, 'empresa');
    const cidade       = val(row, 'cidade');
    const faturamento  = val(row, 'faturamento');
    const invAds       = val(row, 'investimento_ads');
    const agenciaAtual = val(row, 'agencia_atual');
    const veioAnuncio  = val(row, 'veio_de_anuncio') || 'nao';
    const utmSource    = val(row, 'utm_source');
    const utmMedium    = val(row, 'utm_medium');
    const utmCampaign  = val(row, 'utm_campaign');
    const utmContent   = val(row, 'utm_content');
    const statusQualif = val(row, 'status_qualif');

    // Nome do source (bonito) baseado na LP
    const sourceMap = {
      'trafego-pago':   'LP Tráfego Pago',
      'assessoria':     'LP Assessoria',
      'sites':          'LP Sites e LPs',
      'crm-ia':         'LP CRM + IA',
      'posicionamento': 'LP Posicionamento Digital',
      'aceleracao':     'LP Método Aceleração (A)',
      'aceleracao-b':   'LP Método Aceleração (B - Dobrar 90d)',
      'metodo':         'LP /metodo (Aceleração Digital)'
    };
    const source = sourceMap[lpOrigem] || ('LP ' + lpOrigem);

    // Tags coerentes
    const tags = ['lp', 'lp-' + (lpOrigem || 'sheraos')];
    if (veioAnuncio === 'sim') {
      tags.push('veio-de-anuncio');
      if (utmSource) tags.push('fonte-' + utmSource.toLowerCase());
    } else {
      tags.push('organico');
    }
    if (statusQualif) {
      tags.push('qualif-' + statusQualif.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-'));
    }

    const detailParts = [];
    if (empresa) detailParts.push('empresa=' + empresa);
    if (cidade) detailParts.push('cidade=' + cidade);
    if (faturamento) detailParts.push('faturamento=' + faturamento);
    if (invAds) detailParts.push('ads=' + invAds);
    if (agenciaAtual) detailParts.push('agencia=' + agenciaAtual);
    if (veioAnuncio) detailParts.push('veio_de_anuncio=' + veioAnuncio);
    if (utmCampaign) detailParts.push('campaign=' + utmCampaign);
    if (utmContent) detailParts.push('ad=' + utmContent);
    if (statusQualif) detailParts.push('qualif=' + statusQualif);

    const payload = {
      name: nome,
      phone: wpp,
      source: source,
      source_detail: detailParts.join(' | '),
      tags: tags.join(','),
      utm_source: utmSource || '',
      utm_medium: utmMedium || (veioAnuncio === 'sim' ? 'paid' : 'organic'),
      utm_campaign: utmCampaign || '',
      utm_content: utmContent || ''
    };

    const result = enviarParaCRM(payload);
    const now = new Date().toISOString().slice(0, 16);
    sheet.getRange(r + 1, col.crm_status + 1).setValue(result.ok ? 'OK ' + result.code + ' [' + now + ']' : 'ERRO ' + result.code + ': ' + result.body.substring(0, 60));
    if (result.ok) sucessos++; else falhas++;
    processados++;
    Utilities.sleep(400);
  }

  Logger.log('LPs - Processados: ' + processados + ' | Sucessos: ' + sucessos + ' | Falhas: ' + falhas);
  return processados;
}

// ============================================================
// HELPERS
// ============================================================
function enviarParaCRM(payload) {
  try {
    const resp = UrlFetchApp.fetch(CRM_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const code = resp.getResponseCode();
    const body = resp.getContentText();
    return { ok: code >= 200 && code < 300, code: code, body: body };
  } catch (err) {
    return { ok: false, code: 0, body: 'EXCEPTION: ' + String(err.message) };
  }
}

function limparWhatsapp(wpp) {
  var d = String(wpp || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return d;
}

// ============================================================
// UTILS DE MANUTENÇÃO
// ============================================================
function testarConexao() {
  const resp = UrlFetchApp.fetch(CRM_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      name: 'Teste Sheraos Webhook v2',
      phone: '5547999999999',
      source: 'Teste Apps Script',
      source_detail: 'teste de conexao apos update v2',
      tags: 'teste-webhook,v2'
    }),
    muteHttpExceptions: true
  });
  Logger.log('Status: ' + resp.getResponseCode());
  Logger.log('Body: ' + resp.getContentText().substring(0, 400));
}

function debugHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheets().forEach(function(sheet) {
    Logger.log('=== ' + sheet.getName() + ' ===');
    var lastCol = sheet.getLastColumn();
    if (lastCol === 0) { Logger.log('(vazia)'); return; }
    var raw = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    var norm = raw.map(normalizeHeader);
    raw.forEach(function(h, i) {
      Logger.log((i+1) + ': "' + h + '" -> "' + norm[i] + '"');
    });
  });
}
