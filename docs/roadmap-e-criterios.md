# Jarvis v7 — roadmap e critérios de entrega

Data: 13/09/2026. Todos os marcos estão **planejados, não implementados**. O objetivo atual é análise e planejamento; nenhuma criação de repositório remoto ou publicação foi realizada.

## Ordem de construção

| Marco | Entrega | Depende de | Evidência para encerrar |
|---|---|---|---|
| M0 — provas de integração | Contratos e provas pequenas de Codex OAuth, Claude OAuth, OpenRouter e Kie; identificar Agnes | Documentação e contas disponíveis na etapa de teste | Relatório por adaptador: funciona, falhou ou pendente, sem confundir instalação com inferência |
| M1 — fundação | Workspace, configuração, sessão local, banco, eventos, doctor e testes de contrato | Decisões técnicas M0 | Instalação limpa abre interface e diagnostica dependências ausentes |
| M2 — cérebro e conhecimento | Chat com Codex, memória, fontes, importadores e histórico canônico; adapters Claude/OpenRouter conforme M0 | M1 e ao menos um cérebro validado | Pergunta real, referência correta, memória após reinício e troca sem perda documental |
| M3 — tarefas e mídia | Worker durável, Kie imagem/vídeo, biblioteca, limites e segundo adaptador após identificação | M1, contrato de ferramentas e M0 mídia | Gera arquivos reais, retoma consulta e recupera download sem duplicar geração |
| M4 — experiência | Voz, persona, grafo, busca e navegação acessível | M2 | Fluxos completos por texto e voz; grafo não interfere na leitura nem inventa fontes |
| M5 — tela | Captura atual, pergunta visual, indicação de posição e gestão de compartilhamento | M2, visão validada | Resposta sobre frame atual; encerramento bloqueia uso de captura antiga |
| M6 — foco e desktop | Timer, alvo adiado, sensores, controle e parada por plataforma | M1, M5, companion quando necessário | Sensor correto em múltiplas janelas e interrupção efetiva do executor |
| M7 — conectores | Pesquisa, rascunhos, Google/Notion/Telegram conforme prioridades | M2, M3 e autorização/configuração por serviço | Documento e mensagem têm resultado remoto verificável; repetição não duplica ação |
| M8 — referência pública | Guias, exemplos, pacote de distribuição, migrações, CI e instalação por outra pessoa | Núcleo e módulos anunciados validados | Clone limpo → instalar → conectar conta própria → executar roteiro sem ajuda do autor |

M0 não bloqueia tudo por causa de um provedor: registrar pendências por adaptador. Codex e núcleo podem avançar enquanto Agnes é identificado e o caminho Claude é esclarecido. Em M8, a documentação deve declarar explicitamente qualquer módulo ainda experimental; não marcar o escopo completo como entregue com testes centrais pendentes.

## Backlog inicial executável

| ID | Trabalho | Aceite específico |
|---|---|---|
| AUTH-01 | Adaptar Codex App Server | Login gerenciado, turno, cancelamento e recuperação, sem tokens na web |
| AUTH-02 | Validar integração Claude | Registrar condição de acesso/distribuição e demonstrar execução oficial com conta própria |
| AUTH-03 | Integrar OpenRouter | Modelo real, streaming, erro de credencial, ferramenta validada e uso registrado |
| KB-01 | Importar e indexar | Markdown/TXT/PDF textual, origem, revisão e erro por arquivo |
| KB-02 | Responder com evidências | Fonte aponta para trecho usado; pergunta sem resposta admite lacuna |
| MEM-01 | Capturar e revisar | Gravação atômica, recuperação imediata, correção/exclusão e exportação |
| RUN-01 | Implementar tarefas duráveis | Reinício preserva estado; cancelamento não vira sucesso |
| MEDIA-01 | Kie imagem e vídeo | Submeter, acompanhar, baixar, validar e abrir resultado real |
| MEDIA-02 | Integrar Agnes | Identificação oficial + mesmo roteiro de contrato, sem endpoints presumidos |
| VOICE-01 | Entrada/saída por voz | Pausa no meio da frase, interrupção e modo silencioso funcionam |
| SCREEN-01 | Ver e orientar | Frame atual e geometria correta; fonte encerrada não é reutilizada |
| DESKTOP-01 | Agir no desktop | Parada fora do LLM, escopo de ação e matriz por OS |
| FOCUS-01 | Medir sessão | Timer estável, alvo correto, sensor indisponível visível e relatório agregado |
| REF-01 | Reproduzir instalação | Pessoa sem dados/configuração do autor completa o roteiro |
| CONFIG-01 | Escolher e alterar opções | Assistente inicial, presets, padrões e seleção por conversa/tarefa sem perda de dados |
| UPDATE-01 | Atualizar e restaurar | Release autenticada, backup, migração, manutenção e rollback compatível; respeitar instalação Git |

## Testes que precisam existir

**Contratos sem serviços externos:** normalização de eventos, validação de ferramentas, estados de tarefa, IDs estáveis, permissões e tratamento de erros. Dados sintéticos e falsos provedores são úteis aqui, identificados como testes, não como validação real de integração.

**Integração local:** importar → indexar → buscar; salvar memória → recuperar → reiniciar → recuperar; editar/excluir → não usar trecho antigo; exportar → restaurar em pasta limpa. Testar nomes de arquivo, symlinks e conteúdo de nota que tenta dar ordens ao executor.

**Provedores reais:** login elegível, turno e cancelamento; visão em modelo capaz; erro de sessão expirada e limite. OpenRouter e mídia usam testes externos separados do CI comum, com orçamento e credenciais locais. Um teste ignorado por falta de conta deve ser `SKIP`, nunca `PASS`.

**Mídia:** falha antes/depois da submissão, timeout sem ID, tarefa ainda ativa após restart, sucesso remoto com download quebrado, resultado duplicado, formato inválido e cancelamento não suportado. O resultado esperado distingue cobrança incerta de trabalho não iniciado.

**Interface:** desktop e mobile, teclado, foco, estados vazios, carregamento, erro, reconexão e fontes. Voz/tela exigem também roteiro manual no navegador real; simulação de mídia não prova microfone ou captura funcionando no dispositivo do usuário.

**Desktop:** validar cada plataforma separadamente, com escala de tela, múltiplos monitores e janelas, permissões negadas e parada no meio de uma ação. Uma captura correta no servidor remoto não valida a tela do cliente.

**Privacidade operacional:** segredos não aparecem em ativos web, exportação ou logs; identidades de distração fictícias não aparecem em relatórios; desligar sensores interrompe coleta. Autorizações são testadas no executor, não apenas no prompt.

## Perfis de lançamento

| Perfil | Deve funcionar | Pode ficar indisponível |
|---|---|---|
| Exploração local | Biblioteca de exemplo, busca e navegação | IA, mídia e contas externas |
| MVP funcional | Um cérebro real, conversa, fontes e memória | Mídia, desktop e conectores |
| Beta criativa | MVP + fila + Kie + arquivos locais | Agnes enquanto não identificado; automações de desktop |
| Referência completa | Cérebros declarados, mídia declarada, voz/tela/foco, testes e guias reproduzíveis | Integrações extras claramente fora do escopo da release |

A release precisa listar quais cérebros e provedores de mídia passaram pelos testes. Se Claude ou Agnes permanecerem pendentes, declarar a entrega parcial correspondente em vez de anunciar toda a matriz como pronta.

O fluxo de escolhas e de manutenção está em [configuração e atualizações](configuracao-e-atualizacoes.md). Configuração entra em M1; seleção por tarefa em M2/M3; gerenciador de releases, migrações e rollback em M8. Até existir atualização automática testada, distribuir um procedimento manual reproduzível e não anunciar um botão que atualize o sistema.

## Repositório que ensina outras pessoas

O código deverá vir acompanhado de:

- README com finalidade, estado real, requisitos, início rápido e exemplo de resultado.
- Guia de instalação por plataforma, incluindo verificação de runtime e atualização.
- Guias separados para Codex OAuth, Claude OAuth elegível, OpenRouter e mídia.
- Guia “como funciona” com o caminho da pergunta até a resposta/ferramenta.
- Tutorial “crie seu primeiro adaptador”, com falso provedor de teste e contrato verificável.
- Tutorial “adicione uma ferramenta”, com schema, permissões, idempotência e erro.
- Receitas próprias: perguntar às notas, salvar memória, gerar capa, animar imagem e preparar documento.
- Exemplos fictícios, sem arquivos de clientes, contas do autor ou preços inventados.
- CONTRIBUTING, critérios de PR, changelog, decisões arquiteturais e matriz de compatibilidade.
- Procedimento de backup, restauração, migração e rollback.
- Seleção de licença para o código próprio e atribuições dos componentes utilizados.

Os prompts originais são referências, não substitutos desses guias. A licença do nosso código não atribui automaticamente a mesma licença aos PDFs e transcrições recebidos. Antes de publicar, usar uma lista de arquivos de distribuição e manter referências locais fora do pacote público salvo autorização adequada. Nenhuma publicação está autorizada ou sendo executada neste planejamento.

## Definição de pronto para cada módulo

Um módulo está pronto quando tem fluxo útil real, erros recuperáveis, teste apropriado, documentação e forma de diagnóstico. Botão visível, resposta simulada ou pacote instalado não bastam. O relatório de entrega distingue testes automáticos, chamadas reais, testes manuais e itens pendentes.

O escopo completo depende principalmente de autenticação, contratos externos e compatibilidade de desktop. Estimar prazo total antes das provas M0 criaria falsa precisão. Ao encerrar M0, estimar cada marco com as dependências já observadas e publicar a ordem de releases.

## Decisões ainda abertas

1. Identificação de “Agnes”: nome completo ou endereço. É a única pergunta de fornecedor enviada ao usuário nesta rodada.
2. Stack e instalação: TypeScript/React/Fastify/SQLite e operação local são propostas deste plano.
3. Condições da distribuição Claude OAuth: resolver a divergência documental antes de prometer integração pública universal.
4. Prioridade de sistemas operacionais para controle de desktop; início proposto no ambiente local disponível.
5. Licença do código próprio e destino do repositório remoto, na etapa de preparar a publicação.

Essas decisões não impedem usar o plano como especificação inicial. Apenas a implementação dependente de cada uma aguarda sua resolução.
