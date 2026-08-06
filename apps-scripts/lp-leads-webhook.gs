/**
 * SHERAOS - WEBHOOK LPs
 *
 * Planilha: ENTRADA DE LEADS - FORM 1 SHERAOS
 * URL: https://docs.google.com/spreadsheets/d/1puGTEk3azGaLs_uVCUiqFGV5zSraxiuFPJiJo6NOcDE/edit
 * Aba: LEADS LANDING PAGES
 *
 * O QUE FAZ:
 * Recebe leads das 4 LPs (trafego, assessoria, sites, crm-ia) via POST
 * e escreve na aba LEADS LANDING PAGES com tracking completo (UTMs,
 * referrer, tempo de pagina, user agent, gclid, fbclid, IP quando possivel).
 *
 * COMO INSTALAR:
 * 1. Abre a planilha no navegador
 * 2. Menu: Extensoes > Apps Script
 * 3. Cria arquivo novo (icone + na esquerda) chamado "lp-leads-webhook"
 * 4. Cola todo esse codigo
 * 5. Salva (Ctrl+S)
 * 6. Menu: Implantar > Nova implantacao
 *    - Tipo: Aplicativo da Web
 *    - Descricao: LP Sheraos Webhook v1
 *    - Executar como: Eu (seu email)
 *    - Quem tem acesso: Qualquer usuario
 *    - Clica em Implantar
 *    - Autoriza permissoes quando pedir
 * 7. Copia a URL do "Aplicativo da Web" (algo tipo https://script.google.com/macros/s/AKfycb.../exec)
 * 8. Cola essa URL no arquivo /lp/lp.js linha WEBHOOK_URL
 *
 * FASE 2 (futuro): adaptar form1-sheraos-crm-webhook.gs pra ler tambem da
 * aba LEADS LANDING PAGES e jogar leads qualificados no CRM Sheraos.
 */

const SHEET_ID = '1puGTEk3azGaLs_uVCUiqFGV5zSraxiuFPJiJo6NOcDE';
const SHEET_NAME = 'LEADS LANDING PAGES';

const HEADERS = [
  'timestamp',
  'lp_origem',
  'nome',
  'whatsapp',
  'empresa',
  'cidade',
  'faturamento',
  'investimento_ads',
  'agencia_atual',
  'veio_de_anuncio',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'referrer',
  'gclid',
  'fbclid',
  'user_agent',
  'tempo_pagina_seg',
  'url_completa',
  'status_qualif',
  'crm_status'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
    } else {
      data = (e && e.parameter) || {};
    }

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#f1f5f9');
      sheet.setFrozenRows(1);
    }

    // Safeguard: rejeita submissions sem os campos obrigatorios
    // (caso alguem burlar o JS do frontend)
    var nomeOk = String(data.nome || '').trim().length >= 2;
    var wppOk  = String(data.whatsapp || '').replace(/\D/g,'').length >= 10;
    if (!nomeOk || !wppOk) {
      return jsonResponse({ ok: false, error: 'campos_obrigatorios_faltando' });
    }

    var status = qualificarLead(data);
    var veioAnuncio = detectarAnuncio(data);

    var row = [
      new Date(),
      data.lp_origem || '',
      data.nome || '',
      data.whatsapp || '',
      data.empresa || '',
      data.cidade || '',
      data.faturamento || '',
      data.investimento_ads || '',
      data.agencia_atual || '',
      veioAnuncio,
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      data.utm_content || '',
      data.utm_term || '',
      data.referrer || '',
      data.gclid || '',
      data.fbclid || '',
      data.user_agent || '',
      data.tempo_pagina_seg || '',
      data.url_completa || '',
      status,
      ''
    ];

    sheet.appendRow(row);

    return jsonResponse({ ok: true, status_qualif: status });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput('LP Sheraos webhook ativo. Enviar POST com JSON.');
}

/**
 * Qualifica o lead com base em faturamento + investimento em ads.
 * Retorna: "Qualificado", "Frio", ou "A qualificar".
 */
function qualificarLead(d) {
  var fat = String(d.faturamento || '').toLowerCase();
  var ads = String(d.investimento_ads || '').toLowerCase();

  var faturaBaixo = (fat.indexOf('ate-50k') === 0 || fat.indexOf('ate 50') === 0 || fat === '');
  var semAds = (ads.indexOf('nao') === 0 || ads.indexOf('não') === 0 || ads === '');

  if (faturaBaixo && semAds) return 'Frio';

  var qualificado = (fat.indexOf('100k') >= 0 || fat.indexOf('500k') >= 0 || fat.indexOf('1m') >= 0)
    && (ads.indexOf('2k') >= 0 || ads.indexOf('5k') >= 0 || ads.indexOf('15k') >= 0);
  if (qualificado) return 'Qualificado';

  return 'A qualificar';
}

/**
 * Detecta se lead veio de anúncio pago (checa UTMs, gclid, fbclid).
 * Retorna: "sim" ou "nao".
 */
function detectarAnuncio(d) {
  if (d.gclid || d.fbclid) return 'sim';
  var src = String(d.utm_source || '').toLowerCase();
  var med = String(d.utm_medium || '').toLowerCase();
  if (src === 'facebook' || src === 'instagram' || src === 'meta' || src === 'fb' || src === 'ig' || src === 'google' || src === 'tiktok' || src === 'linkedin') return 'sim';
  if (med === 'cpc' || med === 'paid' || med === 'ppc' || med === 'ads') return 'sim';
  return 'nao';
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Utilitario: testa que o script escreve corretamente na planilha.
 * Rode 1x manualmente antes de mandar leads reais pra validar.
 */
function testarEscrita() {
  var e = {
    postData: {
      contents: JSON.stringify({
        lp_origem: 'trafego-pago',
        nome: 'Teste Sheraos',
        whatsapp: '5548999999999',
        empresa: 'Empresa Teste',
        cidade: 'São Paulo / SP',
        faturamento: '100k-500k',
        investimento_ads: '2k-5k',
        agencia_atual: 'nao',
        utm_source: 'meta',
        utm_medium: 'cpc',
        utm_campaign: 'lp-trafego-teste',
        referrer: 'https://www.instagram.com/',
        user_agent: 'Mozilla/5.0 Test',
        tempo_pagina_seg: 42,
        url_completa: 'https://sheraos.com.br/lp/trafego-pago.html?utm_source=meta'
      })
    }
  };
  var resp = doPost(e);
  Logger.log(resp.getContent());
}
