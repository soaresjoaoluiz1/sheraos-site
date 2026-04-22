#!/usr/bin/env node
// Humaniza o tom: "A Sheraos" -> "A gente" em contextos apropriados
const fs = require('fs');

// Ordem importa: mais especificos primeiro
const REPLACEMENTS = [
  // Copy onde faz sentido trocar por "a gente"
  ['A Sheraos é uma assessoria de performance', 'A gente é uma assessoria de performance'],
  ['A Sheraos é uma assessoria de crescimento', 'A gente é uma assessoria de crescimento'],
  ['A Sheraos é uma assessoria', 'A gente é uma assessoria'],
  ['A Sheraos trabalha', 'A gente trabalha'],
  ['A Sheraos nasceu', 'A gente nasceu'],
  ['A Sheraos gera vendas', 'A gente gera vendas'],
  ['A Sheraos é diferente', 'A gente é diferente'],
  ['A Sheraos tem', 'A gente tem'],
  ['A Sheraos não', 'A gente não'],
  ['A Sheraos faz', 'A gente faz'],
  ['A Sheraos entrega', 'A gente entrega'],
  ['A Sheraos oferece', 'A gente oferece'],
  ['A Sheraos atende', 'A gente atende'],
  ['Sheraos resolve', 'gente resolve'],
  ['Na Sheraos você recebe', 'Com a gente você recebe'],
  ['Na Sheraos você', 'Com a gente você'],
  ['Na Sheraos,', 'Com a gente,'],
  ['Na Sheraos ', 'Com a gente '],
  ['A Sheraos ja', 'A gente ja'],  // sem acento (se aparecer)
  ['A Sheraos já', 'A gente já'],
  ['Da Sheraos', 'Da nossa equipe'],

  // Outros ajustes de humanizacao
  ['A Sheraos ', 'A gente '],  // catch-all para casos restantes
];

// NAO TOCAR (manter "Sheraos" nesses contextos):
// - "logo-sheraos.png" (arquivo)
// - "contato@sheraos.com.br" (email)
// - "sheraos.com.br" (dominio)
// - "Sheraos Marketing" (nome da empresa)
// - "Sheraos —" (titulo de pagina)
// - "Sheraos 2026" (copyright)
// - "wa.me/55..." (whatsapp)

function fixText(content) {
  // Proteger blocos que nao devem ser tocados usando placeholders
  const PROTECTED = [];

  // Proteger tags script/style inteiras
  content = content.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, (match) => {
    PROTECTED.push(match);
    return `__PROTECTED_${PROTECTED.length - 1}__`;
  });

  // Proteger atributos href/src/content/meta
  content = content.replace(/(href|src|content|alt)="[^"]*Sheraos[^"]*"/g, (match) => {
    PROTECTED.push(match);
    return `__PROTECTED_${PROTECTED.length - 1}__`;
  });

  // Proteger "logo-sheraos.png", "contato@sheraos", "sheraos.com.br"
  content = content.replace(/logo-sheraos\.png/g, (match) => {
    PROTECTED.push(match);
    return `__PROTECTED_${PROTECTED.length - 1}__`;
  });
  content = content.replace(/contato@sheraos\.com\.br/g, (match) => {
    PROTECTED.push(match);
    return `__PROTECTED_${PROTECTED.length - 1}__`;
  });
  content = content.replace(/sheraos\.com\.br/g, (match) => {
    PROTECTED.push(match);
    return `__PROTECTED_${PROTECTED.length - 1}__`;
  });
  content = content.replace(/Sheraos Marketing/g, (match) => {
    PROTECTED.push(match);
    return `__PROTECTED_${PROTECTED.length - 1}__`;
  });

  // Aplicar substituicoes
  for (const [oldStr, newStr] of REPLACEMENTS) {
    content = content.split(oldStr).join(newStr);
  }

  // Restaurar protegidos
  content = content.replace(/__PROTECTED_(\d+)__/g, (_, idx) => PROTECTED[parseInt(idx)]);

  return content;
}

const files = process.argv.slice(2);
for (const fname of files) {
  if (!fs.existsSync(fname)) { console.log(`SKIP: ${fname}`); continue; }
  const orig = fs.readFileSync(fname, 'utf8');
  const newC = fixText(orig);
  if (newC !== orig) {
    fs.writeFileSync(fname, newC, 'utf8');
    const diff = newC.length - orig.length;
    console.log(`OK: ${fname} (${diff > 0 ? '+' : ''}${diff} bytes)`);
  } else {
    console.log(`-- ${fname}`);
  }
}
