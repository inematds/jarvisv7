# Jarvis v7 — arquitetura e contratos propostos

Status: desenho para implementação; tipos, caminhos e rotas abaixo ainda não existem. O objetivo é manter o projeto compreensível para quem quer reproduzi-lo e criar extensões.

## Stack e fronteiras

Proposta: TypeScript no núcleo e no servidor, React na interface, Fastify para HTTP/eventos, SQLite para estado local e arquivos comuns para documentos e mídia. Uma linguagem principal reduz conversões entre contratos da interface, ferramentas e adaptadores. É uma escolha de projeto, não uma exigência dos documentos de origem.

O protótipo Python de arquivo único dos PDFs continua útil para ensino introdutório; não é a estrutura recomendada para o conjunto completo de tarefas, conexões e mídia. Helpers de desktop podem usar outra linguagem se a plataforma exigir, sem trazer essa dependência para o núcleo.

Começar com um backend e um worker local. Não exigir Redis, Kubernetes, banco vetorial externo ou GPU para o fluxo básico. Processos de provedores e desktop têm ciclo de vida separado; falha de um não encerra a biblioteca ou a interface.

## Estrutura sugerida do repositório

```text
jarvisv7/
  apps/
    web/                  # conversa, biblioteca, mídia, tarefas, conexões
    server/               # HTTP, eventos, sessão local e inicialização
    worker/               # tarefas duráveis e reconciliação
  packages/
    core/                 # casos de uso e estado canônico
    contracts/            # schemas, eventos e erros
    knowledge/            # importação, trechos, busca e grafo
    memory/               # captura, revisão, preferências e exportação
    providers/
      codex/              # adaptador de App Server
      claude/             # runtime oficial, após validar o acesso
      openrouter/         # API de modelos
    media/
      kie/                # submissão e recuperação de trabalhos
      agnes/              # somente após identificar o serviço
    tools/                # registro e executor comum
    desktop/              # adaptadores por plataforma
  examples/               # notas e fluxos fictícios, identificados
  recipes/                # tarefas e prompts próprios de referência
  tests/                  # contratos, integração, ponta a ponta
  scripts/                # instalação, doctor, exportação e preflight
  docs/                   # guias e decisões
  data/                   # dados do usuário, ignorados no Git
```

Documentos de terceiros hoje em `docs/` continuam sendo referências locais. A distribuição pública terá seleção explícita de arquivos: código e guias próprios, links e atribuições; não incluir automaticamente originais nem credenciais no pacote publicado.

## Um núcleo, dois tipos de cérebro

Codex/Claude executam um ciclo de agente próprio. OpenRouter entrega respostas/chamadas de ferramenta e exige um executor nosso para completar o ciclo. Definir um contrato de sessão e eventos comum, com diferenças declaradas de capacidade. Evitar colocar um agente em um ciclo recursivo em torno de outro agente sem limite claro.

O **histórico canônico pertence ao Jarvis v7**. Cada runtime tem um vínculo próprio de sessão. Ao trocar o cérebro, transmitir um resumo auditável e contexto selecionado; não prometer transferência de estado interno ou raciocínio oculto entre provedores.

Contratos conceituais:

| Contrato | Operações | Dados obrigatórios |
|---|---|---|
| `BrainProvider` | estado de autenticação, modelos/capacidades, iniciar turno, interromper, encerrar sessão | provedor, modelo solicitado/resolvido, request ID, vínculo de sessão |
| `BrainEvent` | texto incremental, ferramenta proposta, resultado, uso, conclusão, erro | run ID, sequência, tipo e payload validado |
| `ToolDefinition` | descrever, validar, executar, eventualmente cancelar | nome, schema, permissões, efeitos, idempotência e resultado |
| `MediaProvider` | capacidades, estimativa quando disponível, submeter, consultar, buscar artefato | pedido, modelo, parâmetros, referências, ID remoto |
| `DesktopAdapter` | detectar suporte, capturar, observar alvo, agir, parar | sessão autorizada, monitor, escala, ação e resultado |
| `Connector` | conectar, verificar estado, declarar ferramentas, desconectar | escopos, conta local referenciada e disponibilidade |

O mesmo executor valida ações pedidas por qualquer cérebro. Ferramentas nativas dos runtimes que não passam por esse executor devem estar desabilitadas ou sujeitas a permissões equivalentes. Um prompt sozinho não estabelece essa fronteira.

## Conhecimento, memória e dados

| Entidade | Campos essenciais | Regra |
|---|---|---|
| Document | ID persistente, origem, caminho relativo, hash, revisão | Mudança de conteúdo não troca identidade; rename usa registro de reconciliação |
| Chunk | document ID, trecho, localização, revisão | Citação abre o trecho exato da versão usada |
| Memory | conteúdo, origem, data, categoria, revisão, estado | Usuário pode corrigir, excluir e exportar |
| Conversation / Message | IDs, papel, conteúdo, referências, timestamps | Histórico separado de memória explícita |
| Run / Step | estado, autorização, tentativa, resultado | Nenhuma ação é sucesso só porque o modelo disse |
| MediaJob / Asset | IDs, parâmetros, origem, arquivo, checksum, MIME | Uma saída remota pode gerar vários arquivos locais |
| Connection | provedor, estado, referência ao segredo | Não conter o segredo em respostas públicas |
| FocusSession | tempos, contadores, flags | Persistir agregados, não histórico de sites |

Pipeline de conhecimento: escolher pasta → inventariar → extrair → dividir em trechos → indexar → buscar → selecionar contexto → responder com citações. Começar com Markdown/TXT e extração de PDF textual. PDFs digitalizados devem aparecer como “precisa de OCR”; não considerar leitura bem-sucedida de uma página vazia. DOCX e outros formatos entram por importadores.

Usar busca textual local primeiro. Acrescentar busca semântica quando exemplos reais demonstrarem ganho, sem converter embeddings em requisito para instalar. Tratar textos importados como conteúdo, não como instruções autorizadas para ferramentas.

Gravação e indexação precisam de recuperação: escrever arquivo de forma atômica, registrar intenção/evento e reconstruir índice a partir da fonte quando necessário. Não existe transação única automática entre filesystem, SQLite e serviços externos. Backup deve ser consistente com a versão do schema, e restauração precisa ser exercitada em outra pasta.

## Ciclo de uma tarefa

```text
queued → running → succeeded
                 → failed
                 → awaiting_user → running
                 → cancel_requested → cancelled (se efetivamente parado)
                 → interrupted / unknown (resultado ainda não confirmado)
```

Para mídia, acrescentar `submitted`, `processing` e `downloading`. Persistir ID remoto assim que recebido. Reconciliar trabalhos em andamento no startup. Um pedido de cancelamento não remove do histórico uma geração já submetida.

Idempotência local evita cliques repetidos e callback duplicado. Não garante execução única em uma API externa sem suporte equivalente. Após timeout de submissão, evitar retry cego que crie duas gerações cobradas.

O worker deve ter limites de concorrência, timeout, heartbeat e retomada. Cada tarefa mantém orçamento, modelo, destino de dados e autorização aplicável. O botão “parar” precisa agir no executor imediatamente, mesmo durante uma resposta lenta do LLM.

## API de aplicação proposta

| Área | Rotas de referência |
|---|---|
| Saúde | `GET /api/health`, `GET /api/diagnostics` |
| Conexões | `GET /api/connections`, `POST /api/connections/:id/login`, `POST /api/connections/:id/disconnect` |
| Modelos | `GET /api/models`, `PUT /api/conversations/:id/brain` |
| Conversa | `POST /api/conversations`, `POST /api/conversations/:id/turns` |
| Acompanhamento | `GET /api/runs/:id/events`, `POST /api/runs/:id/cancel` |
| Conhecimento | `POST /api/knowledge/import`, `GET /api/knowledge/search`, `GET /api/documents/:id` |
| Memória | `POST /api/memories`, `PATCH /api/memories/:id`, `DELETE /api/memories/:id` |
| Mídia | `POST /api/media/jobs`, `GET /api/media/jobs/:id`, `GET /api/assets/:id` |
| Foco | `POST /api/focus/sessions`, `POST /api/focus/sessions/:id/actions` |
| Portabilidade | `POST /api/export`, `POST /api/import` |

Eventos precisam de sequência para reconexão sem repetir ações. A API valida tamanhos, formatos, caminhos e identidade da sessão. Bind local por padrão; validar origem e sessão das requisições, inclusive em localhost. O servidor serve apenas ativos autorizados, não qualquer caminho enviado pelo cliente.

## Voz, tela e plataformas

A tela e o microfone pertencem ao dispositivo onde o usuário interage. Se o backend estiver em outra máquina, não inferir que a janela ativa do servidor é a janela do usuário. O modo desktop requer um companion local autenticado e pareado, caso não rode no mesmo dispositivo.

Separar três níveis: analisar captura, orientar em captura, executar ações. Para desktop, preferir identificadores estruturados de controles quando houver suporte; por coordenadas, revalidar captura, resolução, escala e monitor antes de cada ação. O Screen Starter é referência de método, não prova de compatibilidade Linux ou Windows.

A voz terá captura, transcrição e síntese intercambiáveis. A disponibilidade e o processamento remoto das APIs do navegador já estão documentados na [análise inicial](analise-conteudos-e-proposta.md). Ativação por nome não deve ser prometida como confiável em background sem ensaio específico. Texto e botão de parada continuam acessíveis.

## Estúdio de mídia

Um pedido guarda prompt original, prompt efetivo, modelo, parâmetros e referências escolhidas. A biblioteca guarda saídas locais, relação entre versões e origem de cada arquivo. A reprodução registra parâmetros; não promete gerar bytes idênticos em um serviço não determinístico.

Os arquivos enviados para geração são escolhidos explicitamente. Links de download são validados; limitar tamanho, protocolos, destinos e redirects. Downloads vão para uma área dedicada, sem interpretar nomes remotos como caminhos locais. Não abrir automaticamente conteúdo executável.

O fluxo avançado é briefing → roteiro → imagem de referência → vídeo → edição/montagem → exportação. Composição, trilha e legendas podem virar ferramentas adicionais; gerar um clipe não equivale a entregar um vídeo final montado.
