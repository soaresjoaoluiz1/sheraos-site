#!/usr/bin/env node
// Adiciona Google Analytics (G-CHG815RJVG) em todos os HTMLs do site Sheraos
const fs = require('fs');

const GA_SNIPPET = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-CHG815RJVG"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-CHG815RJVG');
</script>
`;

const MARKER = 'G-CHG815RJVG';

const files = process.argv.slice(2);
for (const fname of files) {
  if (!fs.existsSync(fname)) { console.log(`SKIP: ${fname}`); continue; }
  let content = fs.readFileSync(fname, 'utf8');

  // Idempotente: se ja tem o GA, pula
  if (content.includes(MARKER)) {
    console.log(`-- ${fname} (ja tem GA)`);
    continue;
  }

  // Insere antes de </head>
  const headEnd = content.indexOf('</head>');
  if (headEnd === -1) {
    console.log(`ERRO: ${fname} sem </head>`);
    continue;
  }

  const newContent = content.slice(0, headEnd) + GA_SNIPPET + content.slice(headEnd);
  fs.writeFileSync(fname, newContent, 'utf8');
  console.log(`OK: ${fname}`);
}
