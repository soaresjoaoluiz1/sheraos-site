# Sheraos Marketing — Kit Completo 2026

Tudo que foi entregue pra executar os 10 quick wins do plano 360.

---

## Arquivos nesta pasta

### 1. [index.html](index.html) — Site principal
Site completo da Sheraos com design 2026:
- Hero com animacoes e gradientes
- Barra de parceiros (Meta, Google, Shopify, TikTok, Clutch)
- Problema/Solucao (o que acontece vs como a Sheraos resolve)
- 6 servicos com icones
- Preview do dashboard/CRM com grafico animado
- Metodologia em 4 passos
- Numeros (R$ 30M, +300 empresas, 8 anos)
- 3 cases com metricas
- Depoimentos
- 3 planos (Start, Growth, Scale)
- FAQ interativo
- CTA final
- Footer completo + WhatsApp flutuante
- **100% responsivo + dark mode premium**

### 2. [diagnostico.html](diagnostico.html) — Landing page
Landing dedicada pra captar leads qualificados:
- Hero focado em conversao
- 4 beneficios do diagnostico
- Depoimento
- Formulario completo (nome, email, WhatsApp, empresa, faturamento, ads, desafio)
- Radio cards interativos
- Estado de sucesso apos envio
- Trust badges

### 3. [deck-comercial.html](deck-comercial.html) — Apresentacao comercial
Deck de 11 slides pra enviar pra prospects ou apresentar em reunioes:
1. Capa
2. O problema do cliente
3. A solucao Sheraos
4. Numeros e credibilidade
5. Servicos
6. Tecnologia (dashboard)
7. Metodologia
8. Cases
9. Planos e precos
10. Parceiros oficiais
11. CTA pra agendar

Funciona como site (navegacao lateral) e pode ser exportado pra PDF (Ctrl+P).

### 4. [BRAND-BOOK.md](BRAND-BOOK.md) — Manual da marca
Documento completo com:
- Taglines (principal + alternativas)
- Tom de voz (o que somos, o que nao somos, exemplos)
- Identidade visual (cores, tipografia, estilo)
- Planos e precos detalhados
- Bio de Instagram (3 opcoes)
- Descricao LinkedIn completa
- Textos de Google Meu Negocio + checklist
- Templates de cases
- Roteiro do video de apresentacao
- Cronograma de execucao de 3 meses

---

## Como usar

### Ver o site local
Abra qualquer arquivo `.html` no navegador:
- `index.html` → site v1 (institucional moderno)
- `index-v2.html` → site v2 (sales page estilo roadmapdev)
- `index-v3.html` → site v3 (estilo drosagencia, humanizado)
- `diagnostico.html` → landing page de captacao
- `deck-comercial.html` → apresentacao de 11 slides

> Todos os arquivos usam a logo real `logo-sheraos.png` e a identidade visual oficial (navy #0F172A + azul accent #2563EB).

### Publicar o site
Opcoes recomendadas:
1. **Vercel** (gratis, rapido) — faz deploy direto do arquivo
2. **Netlify** (gratis) — drag & drop da pasta
3. **Hostinger/KingHost** — onde o sheraos.com.br ja esta hospedado
4. **GitHub Pages** — gratis se for publico

### Converter deck em PDF
Abra `deck-comercial.html` no navegador e:
1. Pressione `Ctrl+P` (ou Cmd+P no Mac)
2. Destino: "Salvar como PDF"
3. Layout: Paisagem
4. Margens: Nenhuma
5. Ativar "Graficos de fundo"

---

## Checklist de execucao (10 quick wins)

- [x] **1. Tagline e tom de voz definidos** → `BRAND-BOOK.md` secoes 1-2
- [x] **2. Site novo com design 2026** → `index.html`
- [ ] **3. Montar 3 cases detalhados** → Estrutura em `BRAND-BOOK.md` secao 8 (precisa dos dados reais)
- [ ] **4. Gravar video de apresentacao** → Roteiro em `BRAND-BOOK.md` secao 9
- [ ] **5. Configurar Instagram @sheraos** → Bio em `BRAND-BOOK.md` secao 5
- [ ] **6. Criar pagina LinkedIn** → Texto em `BRAND-BOOK.md` secao 6
- [ ] **7. Google Meu Negocio** → Texto + checklist em `BRAND-BOOK.md` secao 7
- [x] **8. Deck comercial** → `deck-comercial.html`
- [x] **9. Landing page de diagnostico** → `diagnostico.html`
- [x] **10. Planos e precos oficiais** → `BRAND-BOOK.md` secao 4

---

## Proximos passos (manuais — precisam de voce)

### Essa semana
1. **Revisar e ajustar** todos os arquivos com dados reais (telefone correto, cases reais, etc.)
2. **Publicar o novo site** em `sheraos.com.br` (substituir ou colocar em paralelo)
3. **Trocar o WhatsApp** nos HTMLs (procurar `5548999999999` e substituir)
4. **Criar o Instagram** @sheraos com a bio do brand book
5. **Criar pagina no LinkedIn** da Sheraos Marketing
6. **Registrar no Google Meu Negocio** com o texto do brand book

### Proximas 2 semanas
1. Gravar o **video de apresentacao** (roteiro no brand book)
2. Escrever os **3 cases reais** (template no brand book) — substituir os placeholders nos HTMLs
3. Produzir **10 posts iniciais** pro Instagram
4. Produzir **5 artigos iniciais** pro LinkedIn
5. Configurar **campanhas de Google Ads e Meta Ads** da Sheraos pra propria agencia
6. Integrar o **formulario de diagnostico** com seu CRM/Email

### Mes 2
1. Publicar **newsletter semanal** com dicas e cases
2. Criar canal no **YouTube** e publicar primeiros videos
3. Criar perfil **TikTok** com Reels curtos
4. Ativar **webinars** mensais
5. Otimizar **SEO** do site com artigos de blog

---

## Customizacoes faceis

### Trocar o numero do WhatsApp
Nos arquivos `index.html`, `diagnostico.html`, `deck-comercial.html`:
```
Procurar: wa.me/5548999999999
Substituir por: wa.me/55SEUNUMERO
```

### Trocar o email
```
Procurar: contato@sheraos.com.br
Substituir por: seu@email.com.br
```

### Trocar cores da marca
No CSS de cada arquivo, modificar as variaveis em `:root`:
```css
--blue: #3b82f6;    /* cor principal */
--violet: #8b5cf6;  /* cor secundaria */
--green: #22c55e;   /* resultados */
```

### Trocar logo (mark SHERAOS)
O logo atual e um hexagono com "S" feito em CSS. Pra usar o logo real:
- Substituir a div `.logo-mark` por uma tag `<img src="logo.png" alt="Sheraos">`

---

## Tecnologia usada

- **HTML5 semantico**
- **CSS moderno** (variaveis, grid, flexbox, animacoes)
- **JavaScript minimo** (intersection observer, interacoes)
- **Sem dependencias** (sem React, sem framework — pura velocidade)
- **Mobile-first**
- **Dark mode premium**
- **Acessivel e SEO-ready**

---

## Estrutura sugerida pra publicar

```
sheraos.com.br/
├── index.html (site principal)
├── diagnostico.html (landing)
├── deck.html (deck comercial)
├── /assets/
│   ├── logo.svg
│   └── images/
├── /cases/
│   ├── laprima.html
│   ├── jolie.html
│   └── homme.html
└── robots.txt + sitemap.xml
```

---

## Suporte

Precisa de algo mais? Edicao especifica, nova secao, integracao com CRM, deploy?
Me avise e bora pra proxima.

---

**Sheraos Marketing** — Abril 2026
