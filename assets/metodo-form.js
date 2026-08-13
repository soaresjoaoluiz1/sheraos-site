/* ============================================================
   Sheraos LP /metodo - Form Multi-step de Qualificacao
   Fluxo: 10 steps -> gate qualificacao -> Calendly
   Cada step envia parcial pro Apps Script (aba LEADS_METODO_Q3)
   ============================================================ */
(function(){

  // TROCAR pela URL do webhook novo apos deploy do Apps Script
  var METODO_WEBHOOK = 'https://script.google.com/macros/s/AKfycbyrBegEs1gM1iFs2xAK8q62kTK3vpnk8WxVejWO1p5bCutc6jOGWgI92YgGJUkxdn3Shw/exec';
  var CALENDLY_URL   = 'https://calendly.com/sheraosmarketing/30min';

  function getParam(n){ return new URLSearchParams(location.search).get(n) || ''; }
  function q(sel){ return document.querySelector(sel); }
  function esc(s){ return String(s||'').replace(/[<>&"]/g, function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];}); }

  var formData = {
    lp_origem: (document.body && document.body.dataset && document.body.dataset.lp) || 'metodo',
    started_at: new Date().toISOString(),
    utm_source: getParam('utm_source'),
    utm_medium: getParam('utm_medium'),
    utm_campaign: getParam('utm_campaign'),
    utm_content: getParam('utm_content'),
    utm_term: getParam('utm_term'),
    gclid: getParam('gclid'),
    fbclid: getParam('fbclid'),
    referrer: document.referrer || '',
    url_completa: location.href,
    user_agent: navigator.userAgent,
    session_id: 'ses_' + Date.now() + '_' + Math.random().toString(36).slice(2,8)
  };

  var STEPS = [
    { type:'welcome',
      title:'Aceleramos empresas de <strong>R$100k+</strong> para <strong>recordes de faturamento</strong>.',
      bullets: [
        {icon:'🎯', text:'Método próprio que já levou +90 empresas de R$100k pra R$300k/mês'},
        {icon:'✅', text:'Estratégia sob medida, nada de campanha genérica'},
        {icon:'📊', text:'Tráfego, CRM, comercial e IA integrados num time só'}
      ],
      cta:'COMEÇAR' },

    { type:'text', name:'nome', label:'Qual seu <strong>nome e sobrenome?</strong>',
      placeholder:'Ex: João Silva',
      validate: function(v){ return v.trim().length >= 3 && v.trim().indexOf(' ') > 0; },
      errorMsg:'Digite nome e sobrenome' },

    { type:'email', name:'email', label:'Qual o seu <strong>melhor e-mail?</strong>',
      placeholder:'nome@empresa.com.br',
      validate: function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
      errorMsg:'E-mail inválido' },

    { type:'tel', name:'whatsapp', label:'Qual seu número de <strong>WhatsApp?</strong>',
      placeholder:'(48) 99999-9999', mask:true,
      validate: function(v){ return v.replace(/\D/g,'').length >= 10; },
      errorMsg:'WhatsApp inválido' },

    { type:'text', name:'instagram', label:'Qual o <strong>@ do Instagram</strong> da sua empresa?',
      placeholder:'@suaempresa',
      validate: function(v){ return v.trim().length >= 2; },
      errorMsg:'Informe o @ do Instagram' },

    { type:'choice', name:'faturamento', label:'Qual o <strong>faturamento mensal médio</strong> da empresa?',
      desc:'Suas informações ficarão em sigilo.',
      options: [
        {label:'Menos de R$ 50 mil', value:'<50k'},
        {label:'R$ 50 mil a R$ 100 mil', value:'50-100k'},
        {label:'R$ 100 mil a R$ 300 mil', value:'100-300k'},
        {label:'R$ 300 mil a R$ 1 milhão', value:'300k-1M'},
        {label:'Acima de R$ 1 milhão', value:'>1M'}
      ]},

    { type:'choice', name:'equipe', label:'Qual o <strong>tamanho da sua equipe?</strong>',
      options: [
        {label:'Sou sozinho', value:'1'},
        {label:'De 2 a 5 pessoas', value:'2-5'},
        {label:'De 6 a 10 pessoas', value:'6-10'},
        {label:'De 11 a 20 pessoas', value:'11-20'},
        {label:'Mais de 20 pessoas', value:'>20'}
      ]},

    { type:'choice', name:'ja_investe_ads', label:'Já <strong>investiu em tráfego pago</strong> antes?',
      options: [
        {label:'Sim, eu mesmo faço', value:'sim-eu'},
        {label:'Sim, tenho time ou agência', value:'sim-agencia'},
        {label:'Nunca investi', value:'nunca'}
      ]},

    { type:'choice', name:'valor_ads_atual', label:'Quanto você <strong>investe hoje em anúncios</strong> por mês?',
      options: [
        {label:'Não invisto em anúncios', value:'zero'},
        {label:'Até R$ 1.000/mês', value:'<1k'},
        {label:'R$ 1.000 a R$ 3.000/mês', value:'1-3k'},
        {label:'R$ 3.000 a R$ 10.000/mês', value:'3-10k'},
        {label:'Acima de R$ 10.000/mês', value:'>10k'}
      ]},

    { type:'info', title:'Como funciona o <strong>investimento</strong>?',
      desc:'Existem <strong>2 tipos de investimento</strong> em tráfego pago:<br><br>• <strong>Saldo em anúncios:</strong> pago direto pra plataforma (Meta / Google), fica no seu cartão.<br>• <strong>Mão de obra Sheraos:</strong> honorário do nosso time, gestão da campanha.<br><br>Como se você tivesse contratado um pintor <em>(mão de obra)</em> e também comprado as tintas <em>(anúncios)</em>. São coisas separadas.',
      cta:'Entendi' },

    { type:'choice', name:'aceita_investir', gate:true,
      label:'Está disposto a investir <strong>ao menos R$ 2.000/mês em anúncios</strong>?',
      desc:'Esse é o valor mínimo pra rodar campanha com resultado medível (não inclui nossos honorários).',
      options: [
        {label:'✓  Sim, quero acelerar meu negócio', value:'sim'},
        {label:'✗  Não é meu momento agora', value:'nao'}
      ]}
  ];

  var current = 0;

  function updateProgress(){
    var step = STEPS[current];
    var bar = q('#qualiProgressBar');
    var num = q('#qualiStepNum');
    // Welcome step: esconde progress bar e contador
    if (step.type === 'welcome') {
      if (bar && bar.parentElement) bar.parentElement.style.display = 'none';
      if (num) num.style.display = 'none';
      return;
    }
    if (bar && bar.parentElement) bar.parentElement.style.display = '';
    if (num) num.style.display = '';
    // A partir do step 1 conta como "Pergunta X de N-1" (exclui welcome)
    var totalUseful = STEPS.length - 1;
    var progressIdx = current; // welcome=0, primeira pergunta=1
    var pct = Math.round((progressIdx / totalUseful) * 100);
    if (bar) bar.style.width = pct + '%';
    if (num) num.textContent = 'Pergunta ' + progressIdx + ' de ' + totalUseful;
  }

  function render(){
    var step = STEPS[current];
    updateProgress();

    var html = '';
    if (step.type === 'welcome') {
      html += '<div class="quali-body quali-welcome">';
      html += '<h3 class="quali-welcome-title">'+ step.title +'</h3>';
      html += '<ul class="quali-welcome-bullets">';
      step.bullets.forEach(function(b){
        html += '<li><span class="wb-ico">'+ esc(b.icon) +'</span><span>'+ esc(b.text) +'</span></li>';
      });
      html += '</ul>';
      html += '</div>';
      html += '<div class="quali-actions"><button type="button" class="quali-btn quali-btn-primary" data-act="next" style="flex:1;">'+ step.cta +'</button></div>';
    }
    else if (step.type === 'intro' || step.type === 'info') {
      html += '<div class="quali-body">';
      html += '<h3 class="quali-title">'+ step.title +'</h3>';
      html += '<p class="quali-desc">'+ step.desc +'</p>';
      html += '</div>';
      html += '<div class="quali-actions">';
      if (current > 0) html += '<button type="button" class="quali-btn quali-btn-back" data-act="back">← Voltar</button>';
      html += '<button type="button" class="quali-btn quali-btn-primary" data-act="next">'+ step.cta +'</button>';
      html += '</div>';
    }
    else if (step.type === 'text' || step.type === 'email' || step.type === 'tel') {
      var val = esc(formData[step.name] || '');
      html += '<div class="quali-body">';
      html += '<h3 class="quali-title">'+ step.label +'</h3>';
      html += '<input class="quali-input" id="qualiInput" type="'+ step.type +'" placeholder="'+ esc(step.placeholder) +'" value="'+ val +'" autocomplete="off" />';
      html += '<div class="quali-error" id="qualiErr" style="color:#fca5a5;font-size:.85rem;margin-top:.4rem;display:none;"></div>';
      html += '</div>';
      html += '<div class="quali-actions">';
      html += '<button type="button" class="quali-btn quali-btn-back" data-act="back">← Voltar</button>';
      html += '<button type="button" class="quali-btn quali-btn-primary" data-act="next">Continuar</button>';
      html += '</div>';
    }
    else if (step.type === 'choice') {
      html += '<div class="quali-body">';
      html += '<h3 class="quali-title">'+ step.label +'</h3>';
      if (step.desc) html += '<p class="quali-desc">'+ step.desc +'</p>';
      html += '<div class="quali-choices">';
      step.options.forEach(function(opt, i){
        var letter = String.fromCharCode(65 + i);
        var isSel = formData[step.name] === opt.value;
        html += '<div class="quali-choice'+ (isSel?' selected':'') +'" data-val="'+ esc(opt.value) +'">';
        html += '<span class="quali-choice-letter">'+ letter +'</span>';
        html += '<span>'+ esc(opt.label) +'</span>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
      html += '<div class="quali-actions">';
      html += '<button type="button" class="quali-btn quali-btn-back" data-act="back">← Voltar</button>';
      html += '<button type="button" class="quali-btn quali-btn-primary" data-act="next"'+ (formData[step.name] ? '' : ' disabled') +'>Continuar</button>';
      html += '</div>';
    }

    var c = q('#qualiContent'); if (c) c.innerHTML = html;
    attachHandlers();
  }

  function attachHandlers(){
    var step = STEPS[current];

    document.querySelectorAll('.quali-choice').forEach(function(el){
      el.addEventListener('click', function(){
        document.querySelectorAll('.quali-choice').forEach(function(c){ c.classList.remove('selected'); });
        el.classList.add('selected');
        formData[step.name] = el.dataset.val;
        var btn = q('.quali-btn-primary');
        if (btn) btn.disabled = false;
      });
    });

    var input = q('#qualiInput');
    if (input) {
      setTimeout(function(){ try { input.focus(); } catch(e){} }, 80);
      if (step.mask) applyWhatsappMask(input);
      input.addEventListener('input', function(){
        formData[step.name] = input.value;
        input.classList.remove('error');
        var err = q('#qualiErr'); if (err) err.style.display='none';
      });
      input.addEventListener('keydown', function(e){
        if (e.key === 'Enter') { e.preventDefault(); goNext(); }
      });
    }

    document.querySelectorAll('[data-act]').forEach(function(el){
      el.addEventListener('click', function(){
        if (el.dataset.act === 'back') goBack();
        else if (el.dataset.act === 'next') goNext();
      });
    });
  }

  function goBack(){ if (current > 0) { current--; render(); } }

  function goNext(){
    var step = STEPS[current];

    if (step.type === 'text' || step.type === 'email' || step.type === 'tel') {
      var input = q('#qualiInput');
      var val = (input && input.value || '').trim();
      formData[step.name] = val;
      if (step.validate && !step.validate(val)) {
        if (input) input.classList.add('error');
        var err = q('#qualiErr'); if (err) { err.textContent = step.errorMsg || 'Campo inválido'; err.style.display='block'; }
        return;
      }
    }
    if (step.type === 'choice' && !formData[step.name]) return;

    sendPartial();

    if (step.gate) {
      if (formData[step.name] === 'nao') return showNotQualified();
      else return showAgendar();
    }

    if (current < STEPS.length - 1) { current++; render(); }
    else showAgendar();
  }

  function showNotQualified(){
    formData.status_qualif = 'nao_qualificado';
    formData.finished_at = new Date().toISOString();
    sendFinal();
    var bar = q('#qualiProgressBar'); if (bar) bar.style.width = '100%';
    var num = q('#qualiStepNum'); if (num) num.textContent = 'Obrigado pelo interesse';
    q('#qualiContent').innerHTML =
      '<div class="quali-notqual">'+
      '<div style="width:64px;height:64px;background:#94A3B8;margin:0 auto 1.25rem;border-radius:50%;display:flex;align-items:center;justify-content:center;">'+
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M12 8v4M12 16h.01"/></svg>'+
      '</div>'+
      '<h4>Tudo bem, entendemos.</h4>'+
      '<p>A Sheraos trabalha com empresas prontas pra investir em crescimento de forma consistente. Quando esse for seu momento, a gente tá aqui. Vamos manter você na nossa lista de conteúdo pra você se preparar.</p>'+
      '<a href="/" style="display:inline-block;margin-top:1.25rem;padding:.9rem 1.5rem;background:rgba(255,255,255,.15);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">← Voltar pro site</a>'+
      '</div>';
  }

  function showAgendar(){
    formData.status_qualif = 'qualificado';
    formData.finished_at = new Date().toISOString();
    sendFinal();
    var bar = q('#qualiProgressBar'); if (bar) bar.style.width = '100%';
    var num = q('#qualiStepNum'); if (num) num.textContent = '✓ 98% concluído...';
    var firstName = formData.nome ? formData.nome.split(' ')[0] : '';
    q('#qualiContent').innerHTML =
      '<div class="quali-finish">'+
      '<div class="check-big"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>'+
      '<h4>Agora escolha o horário, '+ esc(firstName) +'!</h4>'+
      '<p>Selecione um horário no calendário. Você recebe o link do Google Meet por email na hora.</p>'+
      '<button type="button" id="btnCalOpen" class="quali-btn quali-btn-primary" style="width:100%;">AGENDAR ANÁLISE  →</button>'+
      '</div>';

    var btn = q('#btnCalOpen');
    if (btn) btn.addEventListener('click', openCalendly);
    setTimeout(openCalendly, 600);
  }

  function openCalendly(){
    if (!window.Calendly) { setTimeout(openCalendly, 500); return; }
    if (window.gtag) gtag('event', 'agendar_click', { lp: formData.lp_origem });
    Calendly.initPopupWidget({
      url: CALENDLY_URL,
      prefill: {
        name: formData.nome || '',
        email: formData.email || '',
        customAnswers: {
          a1: formData.whatsapp || '',
          a2: formData.instagram || '',
          a3: formData.faturamento || ''
        }
      },
      utm: {
        utmSource:   formData.utm_source,
        utmMedium:   formData.utm_medium,
        utmCampaign: formData.utm_campaign,
        utmContent:  formData.utm_content,
        utmTerm:     formData.utm_term
      }
    });
  }

  function sendPartial(){
    var payload = Object.assign({}, formData, {
      event_type: 'step_completed',
      etapa_atual: STEPS[current].name || STEPS[current].type,
      etapa_num: current + 1
    });
    try {
      fetch(METODO_WEBHOOK, {
        method:'POST', mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body: JSON.stringify(payload)
      }).catch(function(){});
    } catch(e){}
  }
  function sendFinal(){
    var payload = Object.assign({}, formData, { event_type: 'form_finished' });
    try {
      fetch(METODO_WEBHOOK, {
        method:'POST', mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body: JSON.stringify(payload)
      }).catch(function(){});
    } catch(e){}
  }

  function applyWhatsappMask(input){
    input.addEventListener('input', function(e){
      var v = e.target.value.replace(/\D/g, '').substring(0, 11);
      if (v.length > 6) v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
      else if (v.length > 0) v = v.replace(/^(\d{0,2}).*/, '($1');
      e.target.value = v;
    });
  }

  function isCalendlyEvent(e){
    return e.data && e.origin === 'https://calendly.com'
      && typeof e.data.event === 'string'
      && e.data.event.indexOf('calendly.') === 0;
  }
  window.addEventListener('message', function(e){
    if (!isCalendlyEvent(e)) return;
    if (e.data.event === 'calendly.event_scheduled') {
      if (window.fbq) fbq('track', 'Schedule', {
        content_name: 'Analise Estrategica Sheraos',
        value: 1000, currency: 'BRL'
      });
      if (window.gtag) gtag('event', 'schedule_confirmed', {
        lp: formData.lp_origem,
        event_uri: (e.data.payload && e.data.payload.event && e.data.payload.event.uri) || ''
      });
      var payload = Object.assign({}, formData, {
        event_type: 'calendly_scheduled',
        calendly_event_uri: (e.data.payload && e.data.payload.event && e.data.payload.event.uri) || '',
        agendado_em: new Date().toISOString()
      });
      try {
        fetch(METODO_WEBHOOK, {
          method:'POST', mode:'no-cors',
          headers:{'Content-Type':'text/plain;charset=utf-8'},
          body: JSON.stringify(payload)
        }).catch(function(){});
      } catch(err){}
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
