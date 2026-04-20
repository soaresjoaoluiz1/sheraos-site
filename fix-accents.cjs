#!/usr/bin/env node
// Aplica acentuacao portuguesa (PT-BR) em arquivos HTML/MD da Sheraos.
const fs = require('fs');

const REPLACEMENTS = [
  // === REVERSES (corrige erros da primeira execucao) ===
  ['métodologia', 'metodologia'],
  ['Métodologia', 'Metodologia'],
  ['métodologias', 'metodologias'],
  ['laranjá', 'laranja'],
  ['básicamente', 'basicamente'],
  ['Vejá', 'Veja'],
  ['recebê ', 'receber '],

  // === ção / ções ===
  ['execucao', 'execução'], ['Execucao', 'Execução'],
  ['otimizacao', 'otimização'], ['Otimizacao', 'Otimização'], ['otimizacoes', 'otimizações'],
  ['automacao', 'automação'], ['Automacao', 'Automação'], ['automacoes', 'automações'],
  ['integracao', 'integração'], ['Integracao', 'Integração'], ['integracoes', 'integrações'],
  ['informacao', 'informação'], ['Informacao', 'Informação'], ['informacoes', 'informações'],
  ['comunicacao', 'comunicação'], ['Comunicacao', 'Comunicação'],
  ['operacao', 'operação'], ['Operacao', 'Operação'], ['operacoes', 'operações'],
  ['qualificacao', 'qualificação'], ['Qualificacao', 'Qualificação'],
  ['criacao', 'criação'], ['Criacao', 'Criação'],
  ['gravacao', 'gravação'], ['Gravacao', 'Gravação'],
  ['edicao', 'edição'], ['Edicao', 'Edição'],
  ['producao', 'produção'], ['Producao', 'Produção'],
  ['distribuicao', 'distribuição'], ['Distribuicao', 'Distribuição'],
  ['aplicacao', 'aplicação'], ['Aplicacao', 'Aplicação'],
  ['solucao', 'solução'], ['Solucao', 'Solução'],
  ['solucoes', 'soluções'], ['Solucoes', 'Soluções'],
  ['conversao', 'conversão'], ['Conversao', 'Conversão'],
  ['conversoes', 'conversões'], ['Conversoes', 'Conversões'],
  ['decisao', 'decisão'], ['Decisao', 'Decisão'],
  ['questao', 'questão'], ['Questao', 'Questão'],
  ['intencao', 'intenção'], ['Intencao', 'Intenção'], ['intencoes', 'intenções'],
  ['atencao', 'atenção'], ['Atencao', 'Atenção'],
  ['satisfacao', 'satisfação'], ['Satisfacao', 'Satisfação'],
  ['avaliacao', 'avaliação'], ['Avaliacao', 'Avaliação'], ['avaliacoes', 'avaliações'],
  ['configuracao', 'configuração'], ['Configuracao', 'Configuração'], ['configuracoes', 'configurações'],
  ['colaboracao', 'colaboração'],
  ['demonstracao', 'demonstração'],
  ['contratacao', 'contratação'], ['Contratacao', 'Contratação'],
  ['captacao', 'captação'], ['Captacao', 'Captação'],
  ['apresentacao', 'apresentação'], ['Apresentacao', 'Apresentação'],
  ['navegacao', 'navegação'],
  ['acoes', 'ações'], ['Acoes', 'Ações'],
  ['reuniao', 'reunião'], ['Reuniao', 'Reunião'],
  ['reunioes', 'reuniões'],
  ['expressao', 'expressão'],
  ['descricao', 'descrição'], ['Descricao', 'Descrição'], ['descricoes', 'descrições'],
  ['secao', 'seção'], ['Secao', 'Seção'], ['secoes', 'seções'], ['Secoes', 'Seções'],
  ['opcao', 'opção'], ['Opcao', 'Opção'], ['opcoes', 'opções'], ['Opcoes', 'Opções'],
  ['previsao', 'previsão'],
  ['publicacao', 'publicação'],
  ['validacao', 'validação'],
  ['manutencao', 'manutenção'],
  ['reposicionamento', 'reposicionamento'],

  // === comecar (CEDILHA) ===
  ['comecar', 'começar'], ['Comecar', 'Começar'],
  ['comeca ', 'começa '], ['Comeca ', 'Começa '],
  ['comecando', 'começando'], ['Comecando', 'Começando'],
  ['comecou', 'começou'],
  ['comecam', 'começam'],

  // === ê ===
  ['voce ', 'você '], ['Voce ', 'Você '],
  [' voce.', ' você.'], [' voce,', ' você,'], [' voce:', ' você:'], [' voce?', ' você?'],
  ['voces', 'vocês'], ['Voces', 'Vocês'],
  ['mes ', 'mês '], [' mes.', ' mês.'], ['/mes', '/mês'], ['mes,', 'mês,'],

  // === á ===
  ['ja ', 'já '], ['Ja ', 'Já '],
  [' ate ', ' até '], [' Ate ', ' Até '], ['Ate ', 'Até '],
  [' ate.', ' até.'], [' ate o', ' até o'], [' ate a', ' até a'],

  // === ã / õ ===
  ['milhoes', 'milhões'], ['Milhoes', 'Milhões'],
  ['Nao ', 'Não '], ['nao ', 'não '], ['NAO ', 'NÃO '],
  ['Nao.', 'Não.'], ['nao.', 'não.'],
  ['Nao,', 'Não,'], ['nao,', 'não,'],
  ['sao ', 'são '], ['Sao ', 'São '],
  ['irmao', 'irmão'],

  // === ç ===
  ['presenca', 'presença'], ['Presenca', 'Presença'],
  ['servico ', 'serviço '], ['Servico ', 'Serviço '],
  ['servicos', 'serviços'], ['Servicos', 'Serviços'],
  ['cadencia', 'cadência'], ['cadencias', 'cadências'],
  ['licenca', 'licença'],
  ['diferenca', 'diferença'], ['diferencas', 'diferenças'],
  ['forca ', 'força '], ['Forca ', 'Força '], ['forcas', 'forças'],
  ['preco', 'preço'], ['Preco', 'Preço'], ['precos', 'preços'], ['Precos', 'Preços'],
  ['seguranca', 'segurança'], ['Seguranca', 'Segurança'],
  ['esforco', 'esforço'], ['Esforco', 'Esforço'],

  // === ô ===
  ['bonus', 'bônus'], ['Bonus', 'Bônus'],
  ['codigo', 'código'], ['Codigo', 'Código'],
  ['usuario', 'usuário'], ['Usuario', 'Usuário'],
  ['usuarios', 'usuários'], ['Usuarios', 'Usuários'],
  ['formulario', 'formulário'], ['Formulario', 'Formulário'],
  ['ninguem', 'ninguém'],
  ['parabens', 'parabéns'],
  ['porem', 'porém'], ['Porem', 'Porém'],
  ['alem ', 'além '], ['Alem ', 'Além '],
  ['tambem', 'também'], ['Tambem', 'Também'],
  ['vendavel', 'vendável'], ['vendaveis', 'vendáveis'],

  // === í ===
  ['possivel', 'possível'], ['Possivel', 'Possível'],
  ['previsivel', 'previsível'], ['Previsivel', 'Previsível'],
  ['facil', 'fácil'], ['Facil', 'Fácil'],
  ['faceis', 'fáceis'], ['Faceis', 'Fáceis'],
  ['dificil', 'difícil'], ['Dificil', 'Difícil'],
  ['dificeis', 'difíceis'], ['Dificeis', 'Difíceis'],
  ['util ', 'útil '], ['Util ', 'Útil '],
  ['disponivel', 'disponível'], ['Disponivel', 'Disponível'],
  ['invisivel', 'invisível'],
  ['escalavel', 'escalável'], ['escalaveis', 'escaláveis'],
  ['nivel ', 'nível '], ['Nivel ', 'Nível '], ['niveis', 'níveis'],
  ['acessivel', 'acessível'], ['Acessivel', 'Acessível'],

  // === ó/ô (adjetivos) ===
  ['proprio', 'próprio'], ['Proprio', 'Próprio'],
  ['proprios', 'próprios'],
  ['propria', 'própria'], ['Propria', 'Própria'],
  ['proprias', 'próprias'],
  ['proximo', 'próximo'], ['Proximo', 'Próximo'],
  ['proxima', 'próxima'], ['Proxima', 'Próxima'],
  ['proximos', 'próximos'], ['proximas', 'próximas'],
  ['ultimo', 'último'], ['Ultimo', 'Último'],
  ['ultima', 'última'], ['Ultima', 'Última'],
  ['unico', 'único'], ['Unico', 'Único'],
  ['unica', 'única'], ['Unica', 'Única'],

  // === á (adjetivos) ===
  ['pratico', 'prático'], ['Pratico', 'Prático'],
  ['pratica ', 'prática '], ['Pratica ', 'Prática '],
  ['praticas', 'práticas'],
  ['maximo', 'máximo'], ['Maximo', 'Máximo'],
  ['dinamico', 'dinâmico'],
  ['dinamica', 'dinâmica'],
  ['automatico', 'automático'], ['Automatico', 'Automático'],
  ['automatica', 'automática'],
  ['tipico', 'típico'], ['Tipico', 'Típico'],
  ['basica', 'básica'], ['Basica', 'Básica'],
  ['basicas', 'básicas'],
  ['basico', 'básico'], ['Basico', 'Básico'],
  ['basicos', 'básicos'],
  ['tecnologica', 'tecnológica'],
  ['tecnologico', 'tecnológico'],
  ['organico', 'orgânico'], ['Organico', 'Orgânico'],
  ['organica', 'orgânica'],
  ['estrategico', 'estratégico'], ['Estrategico', 'Estratégico'],
  ['estrategica', 'estratégica'], ['Estrategica', 'Estratégica'],
  ['estrategias', 'estratégias'], ['Estrategias', 'Estratégias'],
  ['estrategia', 'estratégia'], ['Estrategia', 'Estratégia'], ['ESTRATEGIA', 'ESTRATÉGIA'],

  ['minimo', 'mínimo'], ['Minimo', 'Mínimo'],
  ['otimo', 'ótimo'], ['Otimo', 'Ótimo'],
  ['otima', 'ótima'], ['Otima', 'Ótima'],

  // === Substantivos tecnicos ===
  ['metodo', 'método'], ['Metodo', 'Método'], ['metodos', 'métodos'],
  ['diagnostico', 'diagnóstico'], ['Diagnostico', 'Diagnóstico'],
  ['analise', 'análise'], ['Analise', 'Análise'],
  ['analises', 'análises'],
  ['relatorio', 'relatório'], ['Relatorio', 'Relatório'],
  ['relatorios', 'relatórios'], ['Relatorios', 'Relatórios'],
  ['escritorio', 'escritório'],
  ['calendario', 'calendário'], ['Calendario', 'Calendário'],
  ['referencia', 'referência'], ['Referencia', 'Referência'],
  ['referencias', 'referências'],
  ['inteligencia', 'inteligência'], ['Inteligencia', 'Inteligência'],
  ['experiencia', 'experiência'], ['Experiencia', 'Experiência'],
  ['experiencias', 'experiências'],
  ['familia', 'família'], ['Familia', 'Família'],
  ['midia', 'mídia'], ['Midia', 'Mídia'],
  ['midias', 'mídias'],
  ['pagina', 'página'], ['Pagina', 'Página'],
  ['paginas', 'páginas'], ['Paginas', 'Páginas'],
  [' area ', ' área '], [' areas ', ' áreas '],
  ['periodico', 'periódico'], ['periodica', 'periódica'],
  ['numero ', 'número '], ['Numero ', 'Número '],
  ['numeros', 'números'], ['Numeros', 'Números'],
  ['publico', 'público'], ['Publico', 'Público'],
  ['publica', 'pública'],
  ['metrica', 'métrica'], ['Metrica', 'Métrica'],
  ['metricas', 'métricas'],
  ['agencia', 'agência'], ['Agencia', 'Agência'],
  ['agencias', 'agências'],
  ['anuncio', 'anúncio'], ['Anuncio', 'Anúncio'],
  ['anuncios', 'anúncios'], ['Anuncios', 'Anúncios'],
  ['duvida', 'dúvida'], ['Duvida', 'Dúvida'],
  ['duvidas', 'dúvidas'], ['Duvidas', 'Dúvidas'],
  ['atraves', 'através'], ['Atraves', 'Através'],
  ['socio', 'sócio'], ['socios', 'sócios'],
  ['icone', 'ícone'], ['icones', 'ícones'],
  ['jargao', 'jargão'], ['Jargao', 'Jargão'],

  // === Conteudo / Videos ===
  ['conteudo', 'conteúdo'], ['Conteudo', 'Conteúdo'], ['CONTEUDO', 'CONTEÚDO'],
  ['conteudos', 'conteúdos'],
  ['Veiculos', 'Veículos'], ['veiculos', 'veículos'],
  ['sera ', 'será '], ['Sera ', 'Será '],
  ['tera ', 'terá '],
  ['video ', 'vídeo '], ['Video ', 'Vídeo '],
  ['videos', 'vídeos'], ['Videos', 'Vídeos'],

  // === Negocio ===
  ['negocio', 'negócio'], ['Negocio', 'Negócio'],
  ['negocios', 'negócios'], ['Negocios', 'Negócios'],

  // === Variacoes ===
  ['multiplas', 'múltiplas'],
  ['multiplos', 'múltiplos'],

  // === "só" ===
  ['nao so ', 'não só '], ['Nao so ', 'Não só '],
  ['Marketing que gera vendas. Nao so curtidas', 'Marketing que gera vendas. Não só curtidas'],
];

function fixText(content) {
  for (const [oldStr, newStr] of REPLACEMENTS) {
    content = content.split(oldStr).join(newStr);
  }
  const verbContexts = [
    [' Sheraos e uma ', ' Sheraos é uma '],
    [' Sheraos e a ', ' Sheraos é a '],
    [' que e ', ' que é '],
    ['E isso!', 'É isso!'],
    [' e o meio', ' é o meio'],
    [' e o que ', ' é o que '],
    [' como e ', ' como é '],
    [' pra quem e ', ' pra quem é '],
    ['logo e um', 'logo é um'],
  ];
  for (const [oldStr, newStr] of verbContexts) {
    content = content.split(oldStr).join(newStr);
  }
  return content;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Uso: node fix-accents.cjs <arquivo1> [arquivo2 ...]');
  process.exit(1);
}

for (const fname of files) {
  try {
    if (!fs.existsSync(fname)) {
      console.log(`SKIP: ${fname}`);
      continue;
    }
    const content = fs.readFileSync(fname, 'utf8');
    const origLen = content.length;
    const newContent = fixText(content);
    if (newContent !== content) {
      fs.writeFileSync(fname, newContent, 'utf8');
      const diff = newContent.length - origLen;
      console.log(`OK: ${fname} (${diff > 0 ? '+' : ''}${diff} bytes)`);
    } else {
      console.log(`-- ${fname} (sem mudancas)`);
    }
  } catch (e) {
    console.error(`ERRO: ${fname} - ${e.message}`);
  }
}
