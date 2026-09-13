> Documento histórico: substituído para decisões atuais pelo [plano mestre do Jarvis v7](plano-mestre-jarvis-v7.md). A exigência atual é Codex/Claude por OAuth e OpenRouter por API; não exigir chave OpenAI/Anthropic como caminho padrão.

# Plano de execução do Jarvis v7

Data: 13/09/2026. Status: planejamento; nenhuma fase implementada.

As prioridades abaixo são propostas a partir dos materiais. Não pressupõem acesso já configurado a notas, chaves ou contas externas. A primeira versão deve funcionar em português e manter entrada textual em todas as etapas.

## Fase 1 — conhecimento e memória

Objetivo: perguntar sobre notas, conferir a origem e salvar uma informação que possa ser recuperada imediatamente.

- [ ] Criar servidor local e interface com chat, notas e fontes.
- [ ] Definir pasta de notas por configuração; usar exemplos claramente identificados enquanto não houver base escolhida.
- [ ] Indexar Markdown, metadados, links e conteúdo com IDs estáveis.
- [ ] Implementar busca com prioridade para título e trechos relevantes.
- [ ] Criar `/chat` com respostas baseadas nas notas e tratamento de ausência de evidência.
- [ ] Criar `/remember` com gravação sem sobrescrever capturas anteriores e atualização imediata do índice.
- [ ] Separar conversa temporária de memória persistente.
- [ ] Manter configuração e credenciais fora dos arquivos públicos.
- [ ] Criar verificação da aplicação em execução, indicando separadamente modo sem chave e chamadas reais.

**Critérios de entrega:** uma pergunta recupera a nota correta e exibe trecho verificável; outra fora da base informa a lacuna; uma memória nova aparece na pergunta seguinte e após reiniciar; configuração não é servida; falta de credencial produz erro compreensível. O modo sem chave não pode ser anunciado como chat de IA validado.

## Fase 2 — voz e navegação visual

- [ ] Entrada e saída por voz em português, quando disponíveis.
- [ ] Buffer de pausa ajustável e interrupção imediata para “pare”.
- [ ] Estados visíveis: ouvindo, processando, falando e indisponível.
- [ ] Modo silencioso centralizado, incluindo `?mute=1`.
- [ ] Grafo de notas com grupos e fontes destacadas; navegação textual equivalente.
- [ ] Persona configurável e saudação com contagem real de notas.

**Critérios de entrega:** pausa no meio da frase não divide a pergunta; “pare” interrompe a fala; aba silenciosa não emite áudio; conversa casual não movimenta o grafo; uma resposta com múltiplas fontes destaca o conjunto correspondente.

## Fase 3 — visão e modelos

- [ ] Captura de tela sob demanda, indicador de compartilhamento e encerramento explícito.
- [ ] Capturar imagem no momento da pergunta e validar o tipo de mídia.
- [ ] Informar falta de captura ou de suporte visual pelo modelo.
- [ ] Interface de provedor, configuração de modelo e aliases exatos.
- [ ] Rejeitar versão inexistente sem substituição silenciosa.
- [ ] Registrar consumo e duração das chamadas, sem imagens ou conteúdo sensível nos logs operacionais.

**Critérios de entrega:** responder sobre a tela atual; encerrar o compartilhamento impede o uso de imagem anterior; troca válida aparece na interface; troca inválida mantém o estado anterior e explica a falha.

## Fase 4 — foco com diagnóstico

Antes de escolher o sensor, verificar onde o navegador e o servidor executam e qual sessão gráfica está disponível. Uma sessão remota pode não representar a tela física do usuário.

- [ ] Temporizador no servidor com pausa, retomada, extensão e término.
- [ ] Fazer prova pequena de leitura da aba/aplicativo no ambiente escolhido.
- [ ] Expor sensor indisponível; nunca interpretar erro de leitura como distração.
- [ ] Implementar alvo adiado, confirmação audível e troca explícita de alvo.
- [ ] Definir comportamento com múltiplas janelas e com o próprio Jarvis em primeiro plano.
- [ ] Incluir carência, silêncio temporário e justificativa de pesquisa.
- [ ] Expor diagnóstico por estados e contadores e salvar somente agregados da sessão.
- [ ] Acrescentar card de desktop somente após provar a integração.

**Critérios de entrega:** recarregar a interface preserva a sessão; iniciar dentro do Jarvis não fixa a aba errada; troca de alvo não exige reinício; sensores com erro aparecem no diagnóstico; um identificador fictício de distração não aparece no estado persistido, relatório ou histórico.

## Fase 5 — percepção opcional

- [ ] Analisar postura localmente e medir falsos alertas antes de contar desvios.
- [ ] Enviar foto apenas em fluxo explícito de pergunta visual.
- [ ] Comparar miniaturas da tela localmente; ajuda automática deve ter opção própria.
- [ ] Configurar intervalos de silêncio e pausa geral dos avisos.
- [ ] Garantir que nenhum desses módulos ative o microfone por conta própria.

**Critérios de entrega:** câmera, tela e microfone têm controles independentes; pausa silencia avisos; nenhum envio de imagem ocorre fora do modo escolhido; leitura prolongada não é automaticamente registrada como falha do usuário.

## Fase 6 — serviços e automações

Escolher uma integração por vez, conforme uso real:

| Módulo | Primeira entrega | Dependência |
|---|---|---|
| Pesquisa web | Resposta com links, data e distinção da base local | Ferramenta de pesquisa e leitura |
| Telegram | Consulta e memória por texto para usuário autorizado | Bot e associação segura da identidade |
| Áudio remoto | Transcrever entrada e responder por áudio opcional | Serviços de voz e limites de tamanho |
| Documentos | Gerar rascunho local a partir de template | Modelo de documento e campos definidos |
| Drive / Docs / Sheets / Notion | Uma operação concreta com retorno verificável | Conta, permissões e conector |
| E-mail | Consultar e preparar rascunhos inicialmente | Conta e escopo definidos |

**Critérios de entrega:** ações retornam o identificador ou arquivo real; repetir uma requisição não duplica a operação; erro de serviço não vira mensagem de sucesso. Publicação e envio usam a autorização aplicável à ação concreta.

Gestos e efeitos holográficos ficam como pesquisa posterior: o próprio vídeo os apresenta como trabalho em andamento.

## Primeira demonstração que queremos conseguir

1. Abrir o Jarvis e ver a contagem real de notas.
2. Perguntar “quais decisões temos sobre este projeto?” e conferir as fontes.
3. Dizer ou digitar “lembre que a primeira versão prioriza conhecimento e memória”.
4. Perguntar “o que priorizamos na primeira versão?” e recuperar a captura.
5. Reiniciar o servidor e repetir a consulta com o mesmo resultado documental.

Estimativas de prazo ficam para depois da escolha da base de notas e da validação de ambiente. A Fase 1 é a próxima unidade de implementação proposta.
