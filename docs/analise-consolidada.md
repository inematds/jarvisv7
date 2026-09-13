# Jarvis v7 — análise consolidada dos materiais

Data: 13/09/2026. Escopo: nove arquivos enviados, oito conteúdos únicos, quatro PDFs distintos. Também foram revisados a análise e o plano anteriores. Esta é uma análise documental, não uma validação do software mostrado nos vídeos.

## Inventário e contribuição de cada arquivo

| Material | Conteúdo e contribuição | Como usar no Jarvis v7 |
|---|---|---|
| `JARVIS-Prompt-Pack.pdf` — 6 páginas | Seis prompts: grafo, cérebro, voz, fontes visuais, persona e memória. Cita `claude -p` como alternativa ao uso de API | Base didática para explicar o ciclo pergunta → busca → resposta → fonte |
| `Build-Your-Own-Jarvis-Fable-5.1-Prompt-Pack.pdf` — 12 páginas | Oito prompts; junta grafo e chat, adiciona visão, preflight e troca exata de modelo | Critérios de confiabilidade, memória imediatamente pesquisável e distinção entre instalação e funcionamento |
| `Build-Your-Own-Jarvis-GPT-6-Astra-Prompt-Pack.pdf` — 22 páginas | Dezesseis prompts; amplia a base com foco, alvo adiado, troca de alvo, câmera, observação da tela e diagnóstico | Especificar sensores e estados do sistema, sem misturar tudo no prompt do modelo |
| `Build-Your-Own-Jarvis-GPT-6-Astra-Prompt-Pack (1).pdf` | Cópia binariamente idêntica do Astra acima | Preservada; não conta como evidência independente |
| `Jarvis-Screen-Starter-Pack.pdf` — 7 páginas | Três prompts: seta em uma captura, ações de mouse/teclado e narração; helpers para macOS | Separar enxergar, orientar e controlar; criar adaptadores de desktop por plataforma |
| `jarvis-claude-fable-5.md` | Resumo em português, não transcrição integral. Cita briefing, calendário, e-mail, memória e troca via OpenRouter | Visão do produto completo; detalhes técnicos precisam de definição nossa |
| `jarvis-claude-fable-5-1.md` | Transcrição: geração de cobrança a partir de arquivos, entrega por Telegram, ferramentas e ligação demonstrativa | Fluxos compostos e comprovação de resultado; telefonia é integração adicional |
| `jarvis-sem-filtro-resultados-insanos.md` | Transcrição: humor ajustável, crítica de currículo/tela, reescrita em Docs, pesquisa e campanha em rascunho | Personalidade ajustável, trabalho em segundo plano, artefatos e parada do controle de tela |
| `Texto colado(20260913-134430).txt` | Transcrição Astra: busca, visão, foco, Telegram e conexões; gestos ainda em desenvolvimento | Confirmar a experiência desejada e distinguir demonstração de implementação entregue |

Os nomes acima correspondem aos originais em `docs/`. Os hashes completos, tamanhos, duplicidade e caminhos de extração estão em [inventario-arquivos.json](inventario-arquivos.json). O texto pesquisável dos quatro PDFs está em `extraidos/`.

Durante esta revisão, duas cópias históricas de `docs/fontes/` estavam vazias. Foram restauradas a partir dos arquivos íntegros da raiz de `docs/`, com verificação de hash. Os nove arquivos enviados nesta rodada foram preservados.

## Síntese: o que realmente forma o sistema

Os pacotes convergem em cinco fundamentos: conhecimento do usuário, memória persistente, conversa, ferramentas e contexto de tela. A interface 3D organiza visualmente parte desses dados; não substitui busca, indexação ou memória. O modelo pode mudar enquanto os dados e as ferramentas continuam nossos.

Há uma evolução documental: o pacote inicial explica uma construção pequena; Fable 5.1 reforça verificações; Astra trata estados de percepção e foco; Screen Starter detalha uma primeira forma de interação com o desktop. Os vídeos mostram uma instalação mais completa que os prompts gratuitos. Não recebemos o código desse sistema completo.

## Decisões que podemos aproveitar

- **Fonte verificável:** abrir a nota ou o trecho que sustenta a resposta, com referência textual além do grafo.
- **Memória útil:** confirmar gravação real e permitir recuperação na pergunta seguinte.
- **Estado explícito:** diferenciar ouvindo, falando, raciocinando, executando, aguardando autorização e desconectado.
- **Interrupção:** parar voz, turno e ações com caminhos próprios; não depender de o LLM interpretar o pedido primeiro.
- **Troca exata:** respeitar provedor e modelo pedidos, sem aproximar silenciosamente nomes ou versões.
- **Diagnóstico real:** verificar o processo em execução e o recurso usado, incluindo imagem correta e arquivo servido atualizado.
- **Tarefas longas:** devolver um identificador e andamento, permitindo continuar a conversa.
- **Personalização:** editar nome de tratamento, idioma, concisão e humor sem alterar políticas de execução.

## Correções e lacunas a resolver

| Ponto dos materiais | Decisão para o nosso projeto |
|---|---|
| IDs iguais à posição no array | Identidade estável de documentos; posição visual é outro campo |
| Prévia de cerca de 700 caracteres | Indexar texto completo em trechos; prévia é apenas apresentação |
| Uma pasta e um `server.py` para tudo | Núcleo modular, contratos de provedores e migrações de dados |
| Regra “só responda pelas notas” junto de pesquisa e conversa geral | Modos explícitos: base pessoal, conversa, pesquisa e execução |
| Prompt 10 Astra abre escuta; prompt 13 impede ativação automática | Janela de resposta somente com escuta já habilitada pelo usuário |
| “Câmera local” também envia foto quando solicitado | Mostrar qual modo está local e qual vai enviar uma imagem |
| Captura de tela confundida com controle | Visualização não concede ação de mouse/teclado |
| Screen Starter mostra seta em imagem; vídeo mostra overlay ao vivo | Entregas diferentes, com suporte de desktop testado separadamente |
| Regras do driver escritas só em `CLAUDE.md` | Autorizações verificadas pelo executor, além de orientações ao agente |
| Hash de domínio tratado como proteção suficiente | Identidades efêmeras, logs filtrados e armazenamento de agregados |
| Postura e tela parada tratadas como distração | Sinais aproximados, ajustáveis; não inferir intenção com certeza |
| “Sem filtro” como nome da demonstração | Humor e franqueza são preferências; fatos e autorizações continuam verificáveis |
| “Grátis”, “cinco minutos”, ganhos percentuais e latências do autor | Não transformar relatos em promessa de instalação, custo ou desempenho |
| macOS e navegador específicos | Matriz de compatibilidade; testar Linux, Windows e macOS antes de declarar suporte |

Nas transcrições, uma resposta confiante é apresentada como resultado de pesquisa, mas não recebemos todos os links ou logs. A nossa pesquisa deverá devolver referências reais. No exemplo de currículo, dados ausentes devem permanecer como campos a preencher, nunca virar realizações inventadas.

## Capacidades novas pedidas para o Jarvis v7

O usuário acrescentou uma escolha explícita de cérebros: Codex por OAuth, Claude por OAuth e OpenRouter por API. Também pediu criação de imagens e vídeos com Kie e um serviço referido como “Agnes”, cuja identificação foi solicitada e ainda está pendente.

Esses requisitos não estão especificados de ponta a ponta nos PDFs. Precisamos criar os adaptadores, a fila de mídia, a biblioteca de arquivos, os limites de gasto e a documentação de instalação. Nenhum token ou conta precisa ser solicitado para concluir este planejamento.

O [plano mestre](plano-mestre-jarvis-v7.md) consolida o produto; [provedores e autenticação](provedores-e-autenticacao.md) registra o que foi verificado em documentação oficial.
