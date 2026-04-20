# Sheraos Marketing — Kit Completo 2026

Tudo que foi entregue pra executar os 10 quick wins do plano 360.

---

## Arquivos nesta pasta

### 1. [index.html](index.html) — Site principal
Site completo da Sheraos com design 2026:
- Hero com animações e gradientes
- Barra de parceiros (Meta, Google, Shopify, TikTok, Clutch)
- Problema/Solução (o que acontece vs como a Sheraos resolve)
- 6 serviços com ícones
- Preview do dashboard/CRM com grafico animado
- Metodologia em 4 passos
- Números (R$ 30M, +300 empresas, 8 anos)
- 3 cases com métricas
- Depoimentos
- 3 planos (Start, Growth, Scale)
- FAQ interativo
- CTA final
- Footer completo + WhatsApp flutuante
- **100% responsivo + dark mode premium**

### 2. [diagnóstico.html](diagnóstico.html) — Landing page
Landing dedicada pra captar leads qualificados:
- Hero focado em conversão
- 4 beneficios do diagnóstico
- Depoimento
- Formulário completo (nome, email, WhatsApp, empresa, faturamento, ads, desafio)
- Radio cards interativos
- Estado de sucesso apos envio
- Trust badges

### 3. [deck-comercial.html](deck-comercial.html) — Apresentação comercial
Deck de 11 slides pra enviar pra prospects ou apresentar em reuniões:
1. Capa
2. O problema do cliente
3. A solução Sheraos
4. Números e credibilidade
5. Serviços
6. Tecnologia (dashboard)
7. Metodologia
8. Cases
9. Planos e preços
10. Parceiros oficiais
11. CTA pra agendar

Funciona como site (navegação lateral) e pode ser exportado pra PDF (Ctrl+P).

### 4. [BRAND-BOOK.md](BRAND-BOOK.md) — Manual da marca
Documento completo com:
- Taglines (principal + alternativas)
- Tom de voz (o que somos, o que não somos, exemplos)
- Identidade visual (cores, tipografia, estilo)
- Planos e preços detalhados
- Bio de Instagram (3 opções)
- Descrição LinkedIn completa
- Textos de Google Meu Negócio + checklist
- Templates de cases
- Roteiro do vídeo de apresentação
- Cronograma de execução de 3 meses

---

## Como usar

### Ver o site local
Abra qualquer arquivo `.html` no navegador:
- `index.html` → site v1 (institucional moderno)
- `index-v2.html` → site v2 (sales page estilo roadmapdev)
- `index-v3.html` → site v3 (estilo drosagência, humanizado)
- `diagnóstico.html` → landing page de captação
- `deck-comercial.html` → apresentação de 11 slides

> Todos os arquivos usam a logo real `logo-sheraos.png` e a identidade visual oficial (navy #0F172A + azul accent #2563EB).

### Publicar o site
Opções recomendadas:
1. **Vercel** (gratis, rápido) — faz deploy direto do arquivo
2. **Netlify** (gratis) — drag & drop da pasta
3. **Hostinger/KingHost** — onde o sheraos.com.br já esta hospedado
4. **GitHub Pages** — gratis se for público

### Converter deck em PDF
Abra `deck-comercial.html` no navegador e:
1. Pressione `Ctrl+P` (ou Cmd+P no Mac)
2. Destino: "Salvar como PDF"
3. Layout: Paisagem
4. Margens: Nenhuma
5. Ativar "Graficos de fundo"

---

## Checklist de execução (10 quick wins)

- [x] **1. Tagline e tom de voz definidos** → `BRAND-BOOK.md` seções 1-2
- [x] **2. Site novo com design 2026** → `index.html`
- [ ] **3. Montar 3 cases detalhados** → Estrutura em `BRAND-BOOK.md` seção 8 (precisa dos dados reais)
- [ ] **4. Gravar vídeo de apresentação** → Roteiro em `BRAND-BOOK.md` seção 9
- [ ] **5. Configurar Instagram @sheraos** → Bio em `BRAND-BOOK.md` seção 5
- [ ] **6. Criar página LinkedIn** → Texto em `BRAND-BOOK.md` seção 6
- [ ] **7. Google Meu Negócio** → Texto + checklist em `BRAND-BOOK.md` seção 7
- [x] **8. Deck comercial** → `deck-comercial.html`
- [x] **9. Landing page de diagnóstico** → `diagnóstico.html`
- [x] **10. Planos e preços oficiais** → `BRAND-BOOK.md` seção 4

---

## Próximos passos (manuais — precisam de voce)

### Essa semana
1. **Revisar e ajustar** todos os arquivos com dados reais (telefone correto, cases reais, etc.)
2. **Publicar o novo site** em `sheraos.com.br` (substituir ou colocar em paralelo)
3. **Trocar o WhatsApp** nos HTMLs (procurar `5548999999999` e substituir)
4. **Criar o Instagram** @sheraos com a bio do brand book
5. **Criar página no LinkedIn** da Sheraos Marketing
6. **Registrar no Google Meu Negócio** com o texto do brand book

### Próximas 2 semanas
1. Gravar o **vídeo de apresentação** (roteiro no brand book)
2. Escrever os **3 cases reais** (template no brand book) — substituir os placeholders nos HTMLs
3. Produzir **10 posts iniciais** pro Instagram
4. Produzir **5 artigos iniciais** pro LinkedIn
5. Configurar **campanhas de Google Ads e Meta Ads** da Sheraos pra própria agência
6. Integrar o **formulário de diagnóstico** com seu CRM/Email

### Mes 2
1. Publicar **newsletter semanal** com dicas e cases
2. Criar canal no **YouTube** e públicar primeiros vídeos
3. Criar perfil **TikTok** com Reels curtos
4. Ativar **webinars** mensais
5. Otimizar **SEO** do site com artigos de blog

---

## Customizações fáceis

### Trocar o número do WhatsApp
Nos arquivos `index.html`, `diagnóstico.html`, `deck-comercial.html`:
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
- **CSS moderno** (variaveis, grid, flexbox, animações)
- **JavaScript mínimo** (intersection observer, interações)
- **Sem dependencias** (sem React, sem framework — pura velocidade)
- **Mobile-first**
- **Dark mode premium**
- **Acessível e SEO-ready**

---

## Estrutura sugerida pra públicar

```
sheraos.com.br/
├── index.html (site principal)
├── diagnóstico.html (landing)
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

Precisa de algo mais? Edição especifica, nova seção, integração com CRM, deploy?
Me avise e bora pra próxima.

---

**Sheraos Marketing** — Abril 2026
