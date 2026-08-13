/**
 * Sheraos - Webhook do form multi-step da LP /metodo
 * Recebe eventos parciais (step_completed), finais (form_finished)
 * e agendamentos confirmados (calendly_scheduled).
 *
 * Grava/atualiza linha na aba LEADS_METODO_Q3.
 * Identificacao por session_id (nao duplica).
 *
 * DEPLOY:
 * 1. Cole tudo isso no Editor do Apps Script (script.google.com)
 * 2. Ajuste SHEET_ID pra sua planilha
 * 3. Implantar > Nova implantacao > Aplicativo da Web
 *    - Executar como: eu mesmo
 *    - Acesso: Qualquer pessoa (nao pode ser "Qualquer pessoa com conta Google")
 * 4. Copie a URL gerada e cole em /assets/metodo-form.js na variavel METODO_WEBHOOK
 */

// ============================================================
// CONFIG
// ============================================================
var SHEET_ID    = '1kWDaXVWKvVeCPk8SFC-Ry3vsUUhATLK_v4LxaUTx8Kg'; // <- MESMA PLANILHA que ja usa hoje (ajustar se for outra)
var SHEET_NAME  = 'LEADS_METODO_Q3';

var HEADERS = [
  'timestamp_first_seen',
  'timestamp_last_update',
  'session_id',
  'status_qualif',
  'etapa_ultima',
  'agendou',
  'agendado_em',
  'calendly_event_uri',
  // dados
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
  'crm_status'
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

    var rowIdx = findRowBySession_(sheet, sessionId);
    var now = new Date().toISOString();

    if (rowIdx === -1) {
      // primeira vez: cria linha nova
      var row = buildRow_(body, now, now, eventType);
      sheet.appendRow(row);
    } else {
      // ja existe: atualiza campos que vieram + timestamp
      updateRow_(sheet, rowIdx, body, now, eventType);
    }

    return jsonResponse({ok:true, session_id: sessionId, event: eventType});

  } catch(err){
    return jsonResponse({ok:false, error:String(err && err.message || err)});
  }
}

// ============================================================
// HELPERS
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
    // formatacao basica do header
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    sheet.setColumnWidths(1, HEADERS.length, 130);
  } else {
    // garante headers atualizados se algum foi adicionado
    var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (firstRow.join('|') !== HEADERS.join('|')) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
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
      case 'timestamp_first_seen': break; // nunca sobrescreve
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
      case 'crm_status':
        break; // preservar
      default:
        if (body[col] !== undefined && body[col] !== '') newVal = body[col];
    }
    if (newVal !== null) current[i] = newVal;
  });

  sheet.getRange(rowIdx, 1, 1, HEADERS.length).setValues([current]);
}

// ============================================================
// TESTE MANUAL (rodar no editor pra validar)
// ============================================================
function TEST_manual(){
  var payload = {
    session_id: 'test_' + Date.now(),
    event_type: 'step_completed',
    etapa_atual: 'nome',
    nome: 'Joao Teste',
    lp_origem: 'metodo',
    utm_source: 'meta',
    utm_campaign: 'teste_manual'
  };
  var e = { postData: { contents: JSON.stringify(payload) } };
  var res = doPost(e);
  Logger.log(res.getContent());
}
