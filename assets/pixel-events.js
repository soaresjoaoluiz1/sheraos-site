/**
 * Sheraos - Meta Pixel · Auto-tracking + helpers
 *
 * Depende de: fbq() ja inicializado (snippet do Pixel esta no <head>)
 *
 * Eventos disparados automaticamente:
 * - Contact         => clique em qualquer link wa.me (WhatsApp)
 * - InitiateCheckout => clique em CTA que abre formulario (diagnostico, proposta)
 * - Lead            => form da LP submetido com sucesso (padrao)
 * - Lead100k        => form da LP submetido E lead qualificado (fatura +R$100k + investe em ads)
 *
 * ViewContent nao e disparado aqui: o PageView do snippet base ja cobre.
 * Se quisermos separar por tipo de pagina no futuro, adicionar aqui.
 */
(function(){
  if (typeof window === 'undefined' || !window.fbq) {
    // fbq nao carregado ainda - agenda retry
    if (typeof window !== 'undefined') {
      window.addEventListener('load', function(){ setTimeout(init, 300); });
    }
    return;
  }
  init();

  function init(){
    // Auto-tracking em WhatsApp (Contact)
    document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com/send"]').forEach(function(a){
      a.addEventListener('click', function(){
        try {
          window.fbq('track', 'Contact', {
            channel: 'whatsapp',
            location: window.location.pathname
          });
        } catch(e){}
      });
    });

    // Auto-tracking em CTAs de diagnostico / proposta / analise (InitiateCheckout)
    var ctaSelectors = [
      'a[href="diagnostico.html"]',
      'a[href="/diagnostico.html"]',
      'a[href="#contato"]',
      'a[href*="#planos"]'
    ];
    document.querySelectorAll(ctaSelectors.join(',')).forEach(function(a){
      a.addEventListener('click', function(){
        try {
          window.fbq('track', 'InitiateCheckout', {
            source: 'cta-btn',
            cta_text: (a.textContent || '').trim().substring(0, 60),
            location: window.location.pathname
          });
        } catch(e){}
      });
    });
  }

  /**
   * Helper global pra ser chamado no submit dos forms da LP.
   * Dispara Lead100k se o lead se qualifica (faturamento >= R$100k + investe em ads).
   * Caso contrario, dispara Lead padrao.
   *
   * Uso:
   *   window.sheraosTrackLead({
   *     lp_origem: 'trafego-pago',
   *     faturamento: '100k-500k',
   *     investimento_ads: '2k-5k'
   *   });
   */
  window.sheraosTrackLead = function(data){
    if (!window.fbq) return;
    var fat = String((data && data.faturamento) || '').toLowerCase();
    var ads = String((data && data.investimento_ads) || '').toLowerCase();

    var faturaOk = fat.indexOf('100k') >= 0 || fat.indexOf('500k') >= 0 || fat.indexOf('1m') >= 0;
    var adsOk = ads.indexOf('2k') >= 0 || ads.indexOf('5k') >= 0 || ads.indexOf('15k') >= 0;

    var payload = {
      lp: (data && data.lp_origem) || 'unknown',
      faturamento: (data && data.faturamento) || '',
      ads_investido: (data && data.investimento_ads) || '',
      empresa: (data && data.empresa) || '',
      cidade: (data && data.cidade) || '',
      currency: 'BRL'
    };

    try {
      if (faturaOk && adsOk) {
        // Lead qualificado (empresa +100k + investe +2k/mes em ads) - evento customizado pra otimizacao Meta
        window.fbq('trackCustom', 'Lead100k', Object.assign({}, payload, { value: 500 }));
        // Tambem dispara Lead padrao pra consistencia de reporting (valor maior indica prioridade)
        window.fbq('track', 'Lead', Object.assign({}, payload, { qualified: true, value: 300 }));
      } else {
        window.fbq('track', 'Lead', Object.assign({}, payload, { qualified: false, value: 50 }));
      }
    } catch(e){}
  };
})();
