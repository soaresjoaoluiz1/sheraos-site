/**
 * Sheraos - Webhook do form multi-step da LP /metodo
 * ============================================================
 * Recebe eventos parciais (step_completed), finais (form_finished)
 * e agendamentos confirmados (calendly_scheduled).
 *
 * FLUXO:
 * - Cada step -> insere/atualiza linha na planilha (identifica por session_id)
 * - Form finalizado + qualificado (aceita_investir=sim) -> envia pro CRM Sheraos
 * - Calendly agendado -> marca agendou=sim e atualiza CRM (via source_detail)
 *
 * DEPLOY (a cada mudanca):
 * 1. Cole tudo no Editor Apps Script (script.google.com > seu projeto)
 * 2. Implantar > Nova implantacao > Aplicativo da Web
 *    - Executar como: eu mesmo
 *    - Acesso: Qualquer pessoa (NAO "com Conta Google")
 * 3. Copie a URL /exec gerada e cole em /assets/metodo-form.js na var METODO_WEBHOOK
 *
 * TESTE:
 * - Rode TEST_manual() no editor pra criar linha de teste
 * - Rode TEST_crm() pra validar envio pro CRM
 */

// ============================================================
// CONFIG - PLANILHA NOVA (ENTRADA DE LEADS - SHERAOS - V2)
// ============================================================
var SHEET_ID  = '1Qw9mA4p6Q79IJYQeeG95a6DlK3EIgNeWXs1JGYDCe4c';
var SHEET_NAME = 'LEADS';

// CRM Sheraos webhook (mesmo do form1 v2)
var CRM_WEBHOOK_URL = 'https://sheraos.com.br/crm/api/webhooks/sheets/sheraos-marketing';

var HEADERS = [
  'timestamp_first_seen',   // primeiro contato
  'timestamp_last_update',  // ultima interacao
  'session_id',             // ID unico por sessao (deduplica)
  'status_qualif',          // em_andamento | qualificado | nao_qualificado
  'etapa_ultima',           // nome da ultima etapa preenchida
  'agendou',                // sim | nao
  'agendado_em',            // ISO datetime do agendamento
  'calendly_event_uri',     // URI do evento Calendly (pra referencia)
  // dados do form
  'nome',
  'email',
  'whatsapp',
  'instagram',
  'faturamento',
  'equipe',
  'ja_investe_ads',
  'valor_ads_atual',
  'aceita_investir',
  // tracking
  'lp_origem',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'referrer',
  'url_completa',
  'user_agent',
  // status pos-processamento
  'crm_status'              // OK 200 [ts] | ERRO ... | PENDENTE | (vazio)
];

// ============================================================
// ENTRY POINTS
// ============================================================
function doGet(){
  return ContentService.createTextOutput(JSON.stringify({
    ok: true, service: 'sheraos-metodo-webhook', ts: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  try {
    var body = {};
    try {
      if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
    } catch(err){
      return jsonResponse({ok:false, error:'json_invalido'});
    }

    var sessionId = String(body.session_id || '').trim();
    if (!sessionId) return jsonResponse({ok:false, error:'session_id_ausente'});

    var sheet = getOrCreateSheet_();
    var eventType = String(body.event_type || 'step_completed');
    var now = new Date().toISOString();

    var rowIdx = findRowBySession_(sheet, sessionId);
    var isFirstTime = rowIdx === -1;

    if (isFirstTime) {
      var row = buildRow_(body, now, now, eventType);
      sheet.appendRow(row);
      rowIdx = sheet.getLastRow();
    } else {
      updateRow_(sheet, rowIdx, body, now, eventType);
    }

    // ==========================================================
    // Envia pro CRM quando qualificado (aceita_investir=sim)
    // OU quando agendou no Calendly (evento definitivo)
    // Evita reenvio verificando crm_status
    // ==========================================================
    var currentCrmStatus = getCellByHeader_(sheet, rowIdx, 'crm_status');
    var jaEnviouCrm = currentCrmStatus && currentCrmStatus.indexOf('OK ') === 0;

    var qualificouAgora = eventType === 'form_finished' && body.status_qualif === 'qualificado';
    var agendouAgora    = eventType === 'calendly_scheduled';

    if ((qualificouAgora || agendouAgora) && !jaEnviouCrm) {
      var linhaCompleta = getRowAsObject_(sheet, rowIdx);
      var resultCrm = enviarParaCRM_(linhaCompleta, agendouAgora);
      var stamp = new Date().toISOString().slice(0, 16);
      var status = resultCrm.ok
        ? 'OK ' + resultCrm.code + ' [' + stamp + ']'
        : 'ERRO ' + resultCrm.code + ': ' + String(resultCrm.body).substring(0, 80);
      setCellByHeader_(sheet, rowIdx, 'crm_status', status);
    }

    return jsonResponse({ok:true, session_id: sessionId, event: eventType, row: rowIdx});

  } catch(err){
    return jsonResponse({ok:false, error:String(err && err.message || err)});
  }
}

// ============================================================
// HELPERS DA PLANILHA
// ============================================================
function jsonResponse(o){
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_(){
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    sheet.setColumnWidths(1, HEADERS.length, 130);
  } else {
    var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (firstRow.join('|') !== HEADERS.join('|')) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    }
  }
  return sheet;
}

function findRowBySession_(sheet, sessionId){
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var colSession = HEADERS.indexOf('session_id') + 1;
  var range = sheet.getRange(2, colSession, lastRow - 1, 1).getValues();
  for (var i = 0; i < range.length; i++) {
    if (String(range[i][0]) === sessionId) return i + 2;
  }
  return -1;
}

function buildRow_(body, firstSeen, lastUpdate, eventType){
  var isSchedule = eventType === 'calendly_scheduled';
  return HEADERS.map(function(col){
    switch(col){
      case 'timestamp_first_seen': return firstSeen;
      case 'timestamp_last_update': return lastUpdate;
      case 'session_id': return body.session_id || '';
      case 'status_qualif': return body.status_qualif || (eventType === 'step_completed' ? 'em_andamento' : '');
      case 'etapa_ultima': return body.etapa_atual || '';
      case 'agendou': return isSchedule ? 'sim' : 'nao';
      case 'agendado_em': return isSchedule ? (body.agendado_em || lastUpdate) : '';
      case 'calendly_event_uri': return isSchedule ? (body.calendly_event_uri || '') : '';
      case 'crm_status': return '';
      default: return body[col] || '';
    }
  });
}

function updateRow_(sheet, rowIdx, body, now, eventType){
  var current = sheet.getRange(rowIdx, 1, 1, HEADERS.length).getValues()[0];
  var isSchedule = eventType === 'calendly_scheduled';

  HEADERS.forEach(function(col, i){
    var newVal = null;
    switch(col){
      case 'timestamp_first_seen': break;
      case 'timestamp_last_update': newVal = now; break;
      case 'status_qualif':
        if (body.status_qualif) newVal = body.status_qualif;
        break;
      case 'etapa_ultima':
        if (body.etapa_atual) newVal = body.etapa_atual;
        break;
      case 'agendou':
        if (isSchedule) newVal = 'sim';
        break;
      case 'agendado_em':
        if (isSchedule && body.agendado_em) newVal = body.agendado_em;
        break;
      case 'calendly_event_uri':
        if (isSchedule && body.calendly_event_uri) newVal = body.calendly_event_uri;
        break;
      case 'crm_status': break;
      default:
        if (body[col] !== undefined && body[col] !== '') newVal = body[col];
    }
    if (newVal !== null) current[i] = newVal;
  });

  sheet.getRange(rowIdx, 1, 1, HEADERS.length).setValues([current]);
}

function getRowAsObject_(sheet, rowIdx){
  var values = sheet.getRange(rowIdx, 1, 1, HEADERS.length).getValues()[0];
  var obj = {};
  HEADERS.forEach(function(col, i){ obj[col] = values[i]; });
  return obj;
}

function getCellByHeader_(sheet, rowIdx, headerName){
  var col = HEADERS.indexOf(headerName) + 1;
  if (col === 0) return '';
  return String(sheet.getRange(rowIdx, col).getValue() || '');
}

function setCellByHeader_(sheet, rowIdx, headerName, value){
  var col = HEADERS.indexOf(headerName) + 1;
  if (col === 0) return;
  sheet.getRange(rowIdx, col).setValue(value);
}

// ============================================================
// ENVIO PRO CRM SHERAOS
// ============================================================
function enviarParaCRM_(lead, agendou){
  try {
    var wpp = String(lead.whatsapp || '').replace(/\D/g, '');
    if (wpp.length < 10) return { ok:false, code:0, body:'whatsapp_invalido' };

    var tags = ['lp', 'lp-metodo'];
    if (lead.utm_source) tags.push('fonte-' + String(lead.utm_source).toLowerCase());
    if (lead.status_qualif) tags.push('qualif-' + String(lead.status_qualif).toLowerCase());
    if (agendou) tags.push('agendou-analise');
    if (lead.gclid) tags.push('google-ads');
    if (lead.fbclid) tags.push('meta-ads');

    var detailParts = [];
    if (lead.instagram) detailParts.push('instagram=' + lead.instagram);
    if (lead.faturamento) detailParts.push('faturamento=' + lead.faturamento);
    if (lead.equipe) detailParts.push('equipe=' + lead.equipe);
    if (lead.ja_investe_ads) detailParts.push('ja_investe_ads=' + lead.ja_investe_ads);
    if (lead.valor_ads_atual) detailParts.push('valor_ads_atual=' + lead.valor_ads_atual);
    if (lead.aceita_investir) detailParts.push('aceita_investir=' + lead.aceita_investir);
    if (agendou) detailParts.push('agendou=sim');
    if (lead.calendly_event_uri) detailParts.push('calendly_uri=' + lead.calendly_event_uri);
    if (lead.utm_campaign) detailParts.push('campaign=' + lead.utm_campaign);
    if (lead.utm_content) detailParts.push('ad=' + lead.utm_content);

    var payload = {
      name: String(lead.nome || 'Lead LP Metodo'),
      phone: wpp,
      email: String(lead.email || ''),
      source: agendou ? 'LP /metodo (Agendou)' : 'LP /metodo (Qualificado)',
      source_detail: detailParts.join(' | '),
      tags: tags.join(','),
      utm_source: String(lead.utm_source || ''),
      utm_medium: String(lead.utm_medium || (lead.utm_source ? 'paid' : '')),
      utm_campaign: String(lead.utm_campaign || ''),
      utm_content: String(lead.utm_content || '')
    };

    var resp = UrlFetchApp.fetch(CRM_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      followRedirects: true
    });
    var code = resp.getResponseCode();
    var body = resp.getContentText();
    return { ok: code >= 200 && code < 300, code: code, body: body };
  } catch(err){
    return { ok: false, code: 0, body: 'EXCEPTION: ' + String(err.message) };
  }
}

// ============================================================
// TESTES MANUAIS (rodar no editor)
// ============================================================
function TEST_manual(){
  var payload = {
    session_id: 'test_' + Date.now(),
    event_type: 'step_completed',
    etapa_atual: 'nome',
    nome: 'Joao Teste',
    lp_origem: 'metodo',
    utm_source: 'meta',
    utm_campaign: 'teste_apps'
  };
  var e = { postData: { contents: JSON.stringify(payload) } };
  var res = doPost(e);
  Logger.log('doPost step:  ' + res.getContent());

  // simula finalizacao qualificada -> deve enviar pro CRM
  var payload2 = Object.assign({}, payload, {
    event_type: 'form_finished',
    status_qualif: 'qualificado',
    email: 'joao@teste.com',
    whatsapp: '48999999999',
    instagram: '@joaoteste',
    faturamento: '100-300k',
    equipe: '6-10',
    ja_investe_ads: 'sim-agencia',
    valor_ads_atual: '3-10k',
    aceita_investir: 'sim'
  });
  var res2 = doPost({ postData:{ contents: JSON.stringify(payload2) } });
  Logger.log('doPost final: ' + res2.getContent());
}

function TEST_crm(){
  var lead = {
    nome: 'Lead Teste CRM',
    email: 'crm@teste.com',
    whatsapp: '48999999999',
    instagram: '@teste',
    faturamento: '100-300k',
    equipe: '6-10',
    ja_investe_ads: 'sim-agencia',
    valor_ads_atual: '3-10k',
    aceita_investir: 'sim',
    status_qualif: 'qualificado',
    utm_source: 'meta',
    utm_campaign: 'teste_manual'
  };
  var r = enviarParaCRM_(lead, false);
  Logger.log(JSON.stringify(r));
}
