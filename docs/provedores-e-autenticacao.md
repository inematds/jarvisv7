# Jarvis v7 — cérebros, autenticação e mídia

Verificação documental: 13/09/2026. Nenhum login foi iniciado, nenhuma credencial foi copiada e nenhuma geração paga foi executada nesta análise. Ter uma ferramenta instalada não demonstra que sua integração já funciona no Jarvis v7.

## Matriz de integração

| Adaptador planejado | Acesso | Papel | Situação |
|---|---|---|---|
| `codex-oauth` | OAuth gerenciado pelo Codex | Conversa e execução por runtime de agente | Fluxo documentado; integração a implementar |
| `claude-oauth` | Conta pessoal via runtime oficial Claude | Conversa e execução por runtime de agente | Intenção confirmada; documentação de distribuição divergente |
| `openrouter` | API key do próprio usuário | Modelos por API | Fluxo documentado; integração a implementar |
| `kie` | API key do próprio usuário | Imagens e vídeos | Fluxo de tarefas documentado; modelos a selecionar e testar |
| `agnes` | A confirmar | Imagens e vídeos | Nome informado pelo usuário; serviço ainda não identificado |

## Codex: caminho preferencial para a primeira prova

Usar o **Codex App Server**, com OAuth gerenciado por ele. A documentação descreve `account/login/start` com tipo `chatgpt`, retorno de `authUrl`, conclusão por evento e renovação dos tokens pelo Codex. Também há fluxo por código de dispositivo. O Jarvis v7 deve consumir estado de autenticação, não extrair tokens e reutilizá-los em uma API diferente. Fonte: [Codex App Server](https://learn.chatgpt.com/docs/app-server).

Proposta de execução: o backend inicia o processo local, negocia o protocolo, associa conversa a sessão e converte eventos em estados do Jarvis. Usar contratos publicados pela versão instalada; não copiar parâmetros de uma versão sem verificar compatibilidade. Token OAuth não vira chave para `api.openai.com`. A documentação distingue login ChatGPT de autenticação por API key. Fonte: [Autenticação Codex](https://learn.chatgpt.com/docs/auth).

Na inspeção anterior desta sessão, `codex login status` informou login com ChatGPT. Nesta revisão, a versão encontrada foi `codex-cli 0.154.0`. Isso é evidência local de disponibilidade da ferramenta, não uma versão mínima definida para distribuição nem teste de inferência do Jarvis.

**Prova de aceite:** descobrir estado; autenticar quando necessário; completar um turno; cancelar outro; tratar reconexão e limite; não expor tokens no navegador; não alterar a configuração global de trabalho da pessoa.

## Claude: manter OAuth no plano, validar a forma de distribuição

O Claude Code documenta login com conta Claude.ai. O modo programático `claude -p` e o Agent SDK oferecem um caminho oficial de execução; o SDK permite callbacks de aprovação e gerenciamento de sessões. Fontes: [Autenticação](https://code.claude.com/docs/en/authentication) e [Execução programática](https://code.claude.com/docs/en/headless).

Há uma divergência relevante nas páginas oficiais consultadas. A visão geral do SDK ainda exige aprovação prévia para terceiros oferecerem login Claude.ai ou limites de assinatura nos seus produtos. Já uma atualização de 15 de junho, na página de suporte, diz que uso do SDK, `claude -p` e apps de terceiros continua consumindo limites da assinatura, suspendendo uma mudança anunciada. Uma página sobre cobrança não resolve sozinha o escopo de autorização de distribuição. Fontes: [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview) e [Uso do SDK com plano Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan).

**Decisão de planejamento:** prever integração local com o runtime oficial da conta do usuário e validar elegibilidade antes de apresentá-la como caminho público universal. Não implementar coleta de cookies, extração de tokens ou proxy de credenciais. Não trocar a preferência do usuário por uma chave Anthropic obrigatória. Se a validação não permitir esse caminho para uma distribuição específica, documentar a limitação e oferecer Claude via OpenRouter, quando disponível no catálogo, como alternativa explícita.

Há também um detalhe técnico: `--bare` não lê o login de assinatura, segundo a página de execução programática. Portanto, não é uma opção adequada para preservar OAuth. O isolamento de diretório, ferramentas e configuração deverá ser validado por outro mecanismo suportado. Fonte: [Execução programática — bare mode](https://code.claude.com/docs/en/headless).

Nesta máquina há Claude Code `2.1.270`; estado de autenticação e inferência não foram testados nesta revisão. Não prometemos uso gratuito ou ilimitado.

**Prova de aceite:** executar com a conta pessoal pelo runtime suportado; transmitir texto/eventos; cancelar; isolar configurações e ferramentas; documentar a condição de uso aplicável; demonstrar que nenhum segredo precisa atravessar a interface web.

## OpenRouter: API explicitamente solicitada

Integrar `POST /api/v1/chat/completions` com credencial no backend. Obter IDs e propriedades pelo catálogo de modelos, em vez de fixar nomes extraídos dos PDFs. Fontes: [Quickstart](https://openrouter.ai/docs/quickstart) e [Catálogo de modelos](https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties).

Propostas nossas: cache datado do catálogo; mapeamento explícito de apelidos; seleção por suporte a texto, visão e ferramentas; streaming quando suportado; limite de duração, passos e saída; medição pelo uso retornado. O usuário seleciona provedor e modelo, e a interface registra o que foi realmente usado. Troca automática de provedor fica desligada por padrão para não mudar custo ou destino dos dados sem a preferência correspondente.

**Prova de aceite:** resposta e stream reais; chamada de ferramenta com argumentos validados; modelo indisponível; credencial inválida; limite; interrupção; consumo registrado. Visão e ferramentas precisam ser testadas no modelo escolhido, não presumidas por existir no catálogo.

## Kie: adaptador de criação com trabalhos persistentes

A Kie documenta modelos de imagem e vídeo, com parâmetros próprios por modelo. O fluxo Market permite criar uma tarefa, consultar seu resultado e opcionalmente receber callback. Fontes: [Market](https://docs.kie.ai/market/quickstart), [exemplo de imagem](https://docs.kie.ai/market/grok-imagine/text-to-image) e [exemplo de vídeo](https://docs.kie.ai/market/grok-imagine/text-to-video).

Para os modelos Market consultados, a submissão usa `POST https://api.kie.ai/api/v1/jobs/createTask`; a consulta usa `GET /api/v1/jobs/recordInfo?taskId=...`. Resultados incluem estado e URLs de saída. Esses endpoints não devem ser presumidos para todas as outras famílias de APIs Kie. Fonte: [Consulta de tarefa](https://docs.kie.ai/market/common/get-task-detail).

Proposta: começar por um modelo de texto para imagem e um de vídeo; adicionar edição e imagem para vídeo após testes específicos. A tarefa guarda ID remoto e parâmetros e volta a ser consultada depois de reiniciar o Jarvis. Em instalação local, preferir polling com intervalos crescentes, dispensando webhook público.

Não repetir submissão paga automaticamente após uma resposta incerta. Persistir intenção antes do envio; se houve timeout e o ID remoto não chegou, marcar estado ambíguo e reconciliar quando possível. Só confirmar “pronto” após baixar e validar o arquivo. Sucesso remoto e arquivo disponível localmente são etapas distintas.

Cancelamento remoto só aparece como capacidade quando comprovado. Se o provedor não cancelar, “parar de acompanhar” não significa “parar cobrança”. Registrar isso com precisão na tarefa.

**Prova de aceite:** imagem e vídeo reais, download íntegro, retomada após reinício, erro e limite de orçamento, URLs indisponíveis e repetição de callback sem duplicar resultado. Os modelos concretos serão escolhidos no início da implementação com o catálogo vigente.

## Agnes: lacuna delimitada

O usuário pediu criação de imagens e vídeos por “Agnes”. Os materiais enviados não identificam esse serviço. Foi solicitado o nome completo ou endereço; ainda não houve resposta específica.

Reservar um adaptador conceitual `agnes`, sem inventar URL, SDK, preço, autenticação ou suporte a formatos. Para implementá-lo, precisamos identificar documentação oficial, credencial, submissão, consulta, modelos, download e eventual cancelamento. Até lá, o núcleo e a Kie podem avançar normalmente; a interface não deve apresentar esse adaptador como conectado ou suportado.

## Regras comuns do Jarvis v7

- Contas e segredos individuais, fora do repositório, dos artefatos, dos logs e das respostas do modelo.
- O browser recebe estados e mensagens de recuperação, nunca tokens OAuth ou chaves dos provedores.
- Conexões independentes: logout de um adaptador não apaga memórias e não desconecta os outros.
- Custo de assinatura, consumo da API e créditos de mídia são medidas diferentes. Sem dados do provedor, mostrar “não informado”, nunca custo zero presumido.
- Metadados de modelos e capacidades serão versionados e testados; disponibilidade documental não equivale a autorização da conta.
- Login pessoal de um provedor não é autenticação de visitantes de uma aplicação hospedada. Multiusuário hospedado é outro perfil de implantação.
