---
name: Jarvis v7
description: Espaço pessoal para conversar com documentos e controlar conexões.
colors:
  bg: "#111411"
  line: "#303830"
  muted: "#a2afa1"
  green: "#b1e5a3"
  green-ink: "#172113"
  danger: "#ffb2a8"
  text: "#e6e9e4"
  field: "#121612"
  primary-hover: "#c5f3b8"
  note: "#8caac7"
  memory: "#a9e19b"
typography:
  display:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "clamp(27px, 2.8vw, 42px)"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.04em"
  headline:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "32px"
    fontWeight: 550
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  title:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "19px"
    fontWeight: 600
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "14px"
  label:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "12px"
    fontWeight: 600
rounded:
  tag: "5px"
  button: "8px"
  field: "9px"
  radius: "14px"
  dialog: "17px"
spacing:
  control-gap: "8px"
  field-gap: "15px"
  panel-padding: "25px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.green-ink}"
    rounded: "{rounded.button}"
    padding: "9px 14px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.button}"
    padding: "9px 14px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "12px 13px"
---

# Design System: Jarvis v7

## Overview

**Creative North Star: "Mesa de trabalho"**

Uma ferramenta pessoal de trabalho com fundo carvão esverdeado, tipografia Manrope local, bordas discretas e verde claro para ações. A densidade favorece conversa, leitura de documentos e configuração de instrumentos com estado explícito.

A direção vem do comentário de `apps/web/index.html` (seed `95931ffc`); os valores e comportamentos abaixo descrevem `apps/web/src/style.css` e `App.tsx`. O nome e os compromissos duráveis vêm de `PRODUCT.md`. O sidecar `.impeccable/design.json` contém snippets autônomos e extensões; suas rampas OKLCH são prévias sintetizadas para o painel, não tokens novos da aplicação. Esta documentação captura a implementação: não constitui aprovação estética contra uma comp ou QUALITY BAR, que não foram estabelecidas.

**Key Characteristics:**

- Superfícies escuras com separação tonal e bordas finas.
- Verde claro como ação, seleção e confirmação.
- Controles compactos com texto explícito sobre estado e disponibilidade.
- Texto como alternativa à voz e ao mapa tridimensional.

## Colors

A paleta combina carvão com matiz verde, texto claro e verdes dessaturados. O frontmatter registra os valores recorrentes; variações locais permanecem no CSS.

**Primary:** `green` identifica a ação principal, foco e navegação selecionada; `green-ink` fornece o texto sobre essa ação. `primary-hover` clareia o botão ao passar o ponteiro.

**Secondary:** `note` distingue notas no mapa; `memory` distingue memórias. São categorias acompanhadas por legenda e lista textual.

**Neutral:** `bg` é o fundo geral, `text` o texto base, `muted` o texto secundário, `line` os divisores e `field` os campos. As propriedades CSS `--surface` e `--raised` estão declaradas, mas ainda não são consumidas; não as tratar como camadas implementadas.

**Estados:** `danger` marca ações destrutivas. Avisos usam tons âmbar; erros, coral; sucesso, verde. Tags e banners incluem texto: cor isolada não comunica o resultado.

## Typography

Manrope Variable é importada localmente por `@fontsource-variable/manrope` em `main.tsx`, com fallback sans-serif. Títulos têm espaçamento negativo e peso intermediário; o corpo mantém leitura direta e compacta.

A hierarquia principal está no frontmatter. O título inicial varia para 46px em telas a partir de 1600px, 38px até 1190px e 30px até 800px. Títulos de página passam a 27px no celular. Subtítulos menores usam 15px/600; labels e controles usam principalmente 11–12px; metadados, 9–11px. Parágrafos têm entrelinha de 1.75, e mensagens de 13px usam 1.95 com largura máxima de 75ch e quebra de palavras longas.

O temporizador usa `ui-monospace, monospace`, números tabulares, peso 350 e tamanho 100px (86px no celular). Não transformar esses números em tipografia geral.

## Layout

O shell ocupa pelo menos 100dvh e mantém navegação esquerda de 226px. O topo mede 75px. Na conversa, a coluna central é flexível e o contexto direito mede 270px (300px a partir de 1600px). A área do compositor tem largura máxima de 880px; o histórico rola dentro da área de mensagens. Páginas de módulos têm máximo de 1340px e padding de 42px 40px 60px; configurações limitam o formulário a 780px e labels a 650px.

Até 1190px, o contexto desaparece, o compositor limita-se a 750px e páginas usam padding de 32px 27px 45px. Até 800px, a navegação vira gaveta fixa de 226px com fundo de bloqueio clicável; o topo mede 64px e páginas usam 28px 20px 40px. A conversa preserva altura mínima de 590px: telas baixas podem exigir rolagem. Abas de configuração rolam horizontalmente; conexões e ações se reorganizam; a listagem de documentos oculta cabeçalho e data.

O estúdio usa formulário de 340px mais resultados flexíveis (310px até 1190px; uma coluna até 800px). A biblioteca alterna duas colunas, uma até 1190px, e duas novamente até 800px. Pares de campos permanecem em duas colunas. O mapa mede 520px de altura, ou 400px no celular, e acompanha a largura disponível via ResizeObserver.

## Elevation & Depth

A interface comum separa áreas por fundo e borda de 1px; botões e painéis não recebem sombra decorativa. A janela modal usa sombra `0 18px 60px #0008` e backdrop `#070b08bd`. A gaveta móvel fica acima do scrim, em níveis 50 e 40. O mapa utiliza profundidade tridimensional funcional.

Movimento é discreto: fundo de botão em 150ms, gaveta em 200ms e indicador giratório em 1.5s linear. `prefers-reduced-motion` remove animações, transições e rolagem suave em CSS. O enquadramento do mapa é controlado por JavaScript, com zoom de 500ms após 400ms; essa preferência não desativa esse movimento.

## Shapes

Cantos suaves distinguem escalas: tags, botões, campos, recipientes e diálogos seguem os raios do frontmatter. Ícones ficam em recipientes compactos, geralmente de 7–11px de raio. O compositor, painéis, ativos e mapa reutilizam `--radius`. Divisores e listas predominam em documentos, conexões, tarefas e onboarding.

## Components

- **Botões:** principal verde, secundário transparente com borda e variante textual sem recipiente. Altura mínima geral de 39px, ícones de ação com área mínima de 34px e envio de 35px. Hover clareia a ação ou adiciona fundo escuro. Botões desabilitados têm opacidade 0.45 e cursor de indisponibilidade; operações mostram rótulos como “Salvando…”.
- **Campos:** labels visíveis, ajuda abaixo, borda fina e fundo escuro. Select tem mínimo de 45px. Checkbox/radio são nativos com acento verde; preferências usam checkbox com `role="switch"`. Busca e compositor removem o outline interno e mudam a borda do recipiente no foco. Não há um sistema geral de erro inline por campo: validação nativa e banners cobrem os fluxos atuais.
- **Navegação:** linha selecionada recebe fundo verde escuro, texto verde e `aria-current="page"`. Abas de configurações usam sublinhado de 2px e são botões dentro de um grupo, sem semântica completa de tablist. A gaveta móvel tem abertura e fechamento rotulados; não implementa focus trap/inert próprio.
- **Tags e feedback:** tags neutras, positivas e de aviso usam borda, fundo e texto distintos. “Credencial salva”, “Conectado”, “Pendente” e “Runtime ausente” descrevem condições diferentes. Banners apresentam erro ou confirmação e botão de fechar; preservar a precisão desses rótulos.
- **Painéis e listas:** painéis têm padding de 25px; ativos usam a mesma forma com mídia contida em área 3:2. Documentos são linhas clicáveis com resumo truncado; estados vazios explicam o próximo passo. Carregamento usa indicador e texto.
- **Conversa:** compositor com textarea, anexação de conhecimento, microfone, compartilhamento opcional, escolha de cérebro e envio/interrupção. Enter envia; Shift+Enter quebra linha. Respostas preservam espaços e quebras; fontes aparecem em botões. Ações e disponibilidade dependem de preferências, navegador e provedor; não representar busca local como inferência de LLM.
- **Diálogos e onboarding:** `<dialog>` aberto com `showModal()`, nome acessível, fechamento por Escape, botão e clique externo. Largura máxima de 620px, largura disponível menos 32px e altura máxima de 90dvh. Onboarding tem duas etapas, escolha por radio e opção de explorar antes de conectar.
- **Mapa:** notas azuis e memórias verdes, links translúcidos e clique para abrir documento. Simulação aquece por 80 ticks e fica estática; arrastar gira e rolar aproxima. Lista de documentos em `<details>` oferece alternativa; abre automaticamente se faltarem links ou ocorrer erro WebGL. Sem conexões, a interface explica wikilinks por título, sem simular relações semânticas.

Foco global usa outline verde de 2px com offset de 4px. Controles de ícone possuem nomes acessíveis em ações principais, e mensagens globais usam papéis de alerta/status. Não há certificação WCAG registrada: fontes pequenas, alvos compactos, foco dos campos compostos, semântica das abas e foco da gaveta são limites a considerar em futuras ampliações.

## Do's and Don'ts

### Do:

- **Do** reutilizar Manrope local, raios e cores existentes antes de criar variações.
- **Do** manter estados textuais e distinguir credencial salva de execução comprovada.
- **Do** preservar a lista textual do mapa e a alternativa escrita à voz.
- **Do** verificar novos fluxos em desktop, celular, teclado e movimento reduzido.

### Don't:

- **Don't** adicionar sombra a todo recipiente; a separação comum é tonal e por borda.
- **Don't** usar cores ou o mapa como única maneira de acessar informação.
- **Don't** anunciar instalação automática de atualizações, aplicativo desktop ou inferência testada sem implementação e evidência.
- **Don't** tratar screenshots ou detector vazio como aprovação estética ou auditoria completa de acessibilidade.
