/* Sheraos LP - JS compartilhado (tracking + submit) */

// ATUALIZE ESSA URL COM A URL DO SEU APPS SCRIPT WEB APP
// (depois de fazer o Deploy > Nova implantacao no Apps Script)
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyrBegEs1gM1iFs2xAK8q62kTK3vpnk8WxVejWO1p5bCutc6jOGWgI92YgGJUkxdn3Shw/exec';

(function(){
  // Timer da pagina
  const T0 = Date.now();

  // Coleta UTMs e parametros de tracking
  function parseParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get('utm_source') || '',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_content: p.get('utm_content') || '',
      utm_term: p.get('utm_term') || '',
      gclid: p.get('gclid') || '',
      fbclid: p.get('fbclid') || ''
    };
  }

  // Preenche hidden inputs com trackings
  function setupHiddenTracking(form) {
    const params = parseParams();
    Object.keys(params).forEach(function(key){
      const el = form.querySelector('input[name="' + key + '"]');
      if (el) el.value = params[key];
    });
    const referrerEl = form.querySelector('input[name="referrer"]');
    if (referrerEl) referrerEl.value = document.referrer || '';
    const urlEl = form.querySelector('input[name="url_completa"]');
    if (urlEl) urlEl.value = window.location.href;
    const uaEl = form.querySelector('input[name="user_agent"]');
    if (uaEl) uaEl.value = navigator.userAgent;
  }

  // Masc do WhatsApp: (00) 00000-0000
  function maskWhatsapp(input) {
    input.addEventListener('input', function(e){
      let v = e.target.value.replace(/\D/g, '').substring(0, 11);
      if (v.length > 6) v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
      else if (v.length > 0) v = v.replace(/^(\d{0,2}).*/, '($1');
      e.target.value = v;
    });
  }

  // Envio do form
  function handleSubmit(form, lpOrigem) {
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const btn = form.querySelector('.lp-submit');
      const btnOriginalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Enviando...';

      // Monta payload
      const fd = new FormData(form);
      const data = { lp_origem: lpOrigem, tempo_pagina_seg: Math.round((Date.now() - T0)/1000) };
      fd.forEach(function(v, k){ data[k] = v; });

      // Envia pro Apps Script (no-cors evita CORS block)
      fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      }).then(function(){
        showSuccess(form);
        // GA4 event
        if (window.gtag) window.gtag('event', 'lead_submit', { lp: lpOrigem });
        // Meta Pixel: Lead100k (qualificado) ou Lead padrao - logica no pixel-events.js
        if (typeof window.sheraosTrackLead === 'function') {
          window.sheraosTrackLead(data);
        } else if (window.fbq) {
          window.fbq('track', 'Lead', { lp: lpOrigem });
        }
      }).catch(function(err){
        console.error(err);
        btn.disabled = false;
        btn.innerHTML = btnOriginalHtml;
        alert('Erro ao enviar. Tente novamente ou chame no WhatsApp.');
      });
    });
  }

  function showSuccess(form) {
    const card = form.closest('.lp-form-card');
    if (!card) return;
    const successEl = card.querySelector('.lp-success');
    form.style.display = 'none';
    const h3 = card.querySelector('h3');
    const desc = card.querySelector('.form-desc');
    if (h3) h3.style.display = 'none';
    if (desc) desc.style.display = 'none';
    if (successEl) successEl.classList.add('show');
    // Scroll suave pro form
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Init
  document.addEventListener('DOMContentLoaded', function(){
    const form = document.querySelector('.lp-form');
    if (!form) return;
    const lpOrigem = document.body.dataset.lp || 'unknown';
    setupHiddenTracking(form);
    const wa = form.querySelector('input[name="whatsapp"]');
    if (wa) maskWhatsapp(wa);
    handleSubmit(form, lpOrigem);
  });
})();
