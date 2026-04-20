#!/usr/bin/env node
// Reverte erros do fix-accents que tocaram codigo CSS/HTML
const fs = require('fs');

const REVERTS = [
  // Erros de CSS/HTML
  ['preçonnect', 'preconnect'],
  ['Preçonnect', 'Preconnect'],
  ['@keyframês', '@keyframes'],
  ['keyframês', 'keyframes'],
  ['src-preçonnect', 'src-preconnect'],
  ['rel="preçonnect"', 'rel="preconnect"'],
  // Adverbios em -mente nao tem acento
  ['automáticamente', 'automaticamente'],
  ['fácilmente', 'facilmente'],
  ['básicamente', 'basicamente'],
  ['dinâmicamente', 'dinamicamente'],
  ['práticamente', 'praticamente'],
  // Outros erros comuns
  ['métodologia', 'metodologia'],
  ['Métodologia', 'Metodologia'],
  ['Vejá', 'Veja'],
  ['laranjá', 'laranja'],
  ['recebê ', 'receber '],
];

const files = process.argv.slice(2);
for (const fname of files) {
  if (!fs.existsSync(fname)) continue;
  let content = fs.readFileSync(fname, 'utf8');
  const orig = content;
  for (const [oldStr, newStr] of REVERTS) {
    content = content.split(oldStr).join(newStr);
  }
  if (content !== orig) {
    fs.writeFileSync(fname, content, 'utf8');
    console.log(`REVERT OK: ${fname}`);
  } else {
    console.log(`-- ${fname}`);
  }
}
