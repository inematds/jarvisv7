> Documento histórico: substituído para decisões atuais pelo [plano mestre do Jarvis v7](plano-mestre-jarvis-v7.md). A exigência atual é Codex/Claude por OAuth e OpenRouter por API; não exigir chave OpenAI/Anthropic como caminho padrão.

# Jarvis v7: análise dos conteúdos e proposta

Data: 13/09/2026.

Podemos usar esse material para construir um assistente pessoal com base de conhecimento local, conversa com fontes, memória por comando, voz e leitura de tela. A melhor primeira entrega é conseguir perguntar sobre nossas notas e salvar informações novas com confiabilidade. O grafo visual acompanha essa experiência; foco, câmera e integrações entram depois.

O diretório do projeto estava vazio na inspeção. Portanto, todas as funcionalidades abaixo são propostas, não recursos existentes ou testes realizados.

## O que recebemos

**Transcrição do vídeo:** demonstra busca de arquivos, pesquisa online, voz com ativação por nome, câmera, compartilhamento de tela, sessões de foco, troca de modelo, integrações e Telegram. O trecho sobre gestos é apresentado como trabalho ainda em desenvolvimento. Referência: [transcrição local](fontes/transcricao-video-jarvis.txt); o endereço do vídeo consta no início dela. A análise usa a transcrição fornecida, sem inspeção visual do vídeo.

**Prompt pack:** material de Zubair Trabzada / AI Workshop, datado de setembro de 2026, com 16 briefs de implementação e verificações. A primeira metade cria a base; a segunda adiciona mecanismos de foco e percepção. É uma especificação orientada a um agente de programação, não um código pronto. Referência: [PDF](fontes/Build-Your-Own-Jarvis-GPT-6-Astra-Prompt-Pack.pdf).

## Os 16 prompts e como aproveitá-los

| Prompt | Conteúdo | Aplicação proposta |
|---|---|---|
| 01 | Indexação Markdown, galáxia 3D, servidor Python e chat com seis notas recuperadas | Base do MVP, com fontes identificáveis |
| 02 | Entrada e saída por voz, espera de 900 ms e modo silencioso | Voz em português, após validar o chat |
| 03 | Destacar no grafo as fontes da resposta | Facilitar conferência; incluir lista textual das fontes |
| 04 | Personalidade de mordomo, respostas curtas e saudação real | Persona configurável, sem humor obrigatório |
| 05 | Comando para guardar memória em Markdown e indexação imediata | Prioridade alta: salvar e recuperar na pergunta seguinte |
| 06 | Captura de tela sob demanda e resposta visual | Ajudar a interpretar erros, documentos e interfaces |
| 07 | Verificação real das cadeias da aplicação | Implementar junto com a base, crescendo por etapa |
| 08 | Troca de modelo com nomes exatos e rejeição de versões inexistentes | Interface de provedor e configuração explícita |
| 09 | Sessões de foco, desvios, pausa e relatório | Começar por temporizador; acrescentar sensores depois |
| 10 | Aguardar a superfície correta antes de fixar o alvo | Evitar travar o foco na própria aba do Jarvis |
| 11 | Alterar o alvo por voz ou botão de desktop | Depende de uma integração de desktop confiável |
| 12 | Falar o nome da distração sem persistir sua identidade | Opcional; prever modo sem nomes |
| 13 | Postura por análise local e foto enviada sob solicitação | Experimento posterior, com modos claramente distintos |
| 14 | Comparação local de tela e ajuda após inatividade visual | Reutilizar a captura; envio automático deve ser opção explícita |
| 15 | Frases variadas ao trocar de modelo | Acabamento de experiência, baixa prioridade |
| 16 | Diagnóstico, painel de depuração e registros agregados | Instrumentação desde o início das sessões de foco |

## O que o vídeo mostra além do roteiro

| Recurso | Evidência na transcrição | Lacuna no PDF |
|---|---|---|
| Pesquisa online | Aproximadamente 03:22–05:07 | Falta o fluxo completo de busca, leitura e citações |
| Gmail, Notion, Docs e Sheets | 08:02–08:43 | Faltam conectores, autenticação e execução de ações |
| Telegram com texto e áudio | 08:43–09:21 | Faltam bot, identificação do usuário e processamento de áudio |
| Documento de cobrança por modelo | 09:21–10:27 | Faltam template, geração e integração de armazenamento |
| Ativação por “Jarvis” | 02:09–02:48 | O prompt 02 começa pelo botão; ativação contínua exige outro fluxo |
| Gestos / “holo hands” | 06:35 e 10:48 | Recurso anunciado como em desenvolvimento, sem prompt correspondente |
| Acesso abrangente a arquivos | 02:48–03:22 | O indexador inicial cobre Markdown, não todos os formatos |

Essas funções podem virar módulos nossos, mas não aparecem automaticamente ao executar os 16 prompts. O próprio material distingue o pacote gratuito do sistema completo da comunidade paga.

## Ajustes que faremos no desenho

1. **Separar conhecimento e ferramentas.** Uma resposta sobre notas deve citar notas. Pesquisa externa precisa de uma ferramenta e URLs. Criar um documento exige uma ação implementada, com resultado verificável. A persona não pode anunciar ações inexistentes.
2. **Guardar identidade estável das notas.** O PDF usa o índice numérico do array como ID. Para crescer, propomos um ID persistente separado da posição visual, evitando referências trocadas após reindexar.
3. **Buscar no conteúdo, exibir trechos.** Os 700 caracteres do prompt servem à prévia visual. Propomos indexar o texto completo e devolver apenas trechos relevantes ao modelo. Um título parecido não basta para sustentar a resposta.
4. **Resolver a regra do microfone.** O prompt 10 pede abertura de uma janela de resposta; o 13 proíbe que módulos liguem o microfone. Nossa regra: essa janela só funciona se o usuário já habilitou a escuta. Caso contrário, mostrar o botão e aceitar texto.
5. **Distinguir processamento local e envio externo.** A câmera do prompt 13 analisa postura localmente, mas o comando de olhar envia uma foto. O prompt 14 compara miniaturas localmente, mas envia uma imagem após o limiar. A interface deve explicar cada modo, sem prometer que todo o recurso é local.
6. **Tratar foco como sinal aproximado.** Tela parada pode ser leitura; cabeça abaixada não prova uso de celular. Inicialmente, os sinais devem sugerir ajuda, sem classificar automaticamente produtividade ou intenção.
7. **Adaptar integração de desktop.** O PDF usa termos como bundle ID e Spaces, ligados ao desenho do ambiente do autor. O caminho local sugere Linux, mas a sessão gráfica do usuário não foi verificada. O leitor de aplicativo/aba e a janela flutuante exigem uma prova de compatibilidade antes da implementação completa.
8. **Não confundir hash com anonimato.** Um domínio previsível pode ser reconhecido por tentativa mesmo após hash. Propomos comparar identidades somente em memória e persistir apenas agregados; nomes falados também precisam ficar fora de logs e históricos.
9. **Diagnosticar antes de ajustar tempos.** Temporizador, sensor, alvo e reprodução de voz devem expor estados próprios. Valores como 700 ms, 900 ms e 60 segundos são pontos de partida do autor, não garantias para nossa máquina.

O compartilhamento de tela depende de ação e escolha do usuário; a aplicação não pode garantir a seleção de “tela inteira” nem reaproveitar uma permissão permanente para iniciar novas capturas. A documentação também exige contexto seguro e ativação transitória. Isso torna necessário um botão explícito e tratamento de cancelamento. Fonte: [MDN — getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia).

O reconhecimento de voz do navegador tem disponibilidade limitada e, em alguns navegadores, envia áudio a um serviço remoto. Usar a API do navegador não significa processamento local ou funcionamento offline. Por isso, texto deve continuar disponível. Fonte: [MDN — SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

## Modelo, custo e alegações

A documentação oficial consultada apresenta o identificador `gpt-6-astra`, entrada de imagem e preços de texto de US$ 10 por milhão de tokens de entrada e US$ 50 de saída. Esses valores correspondem aos preços-base citados no PDF; existem condições adicionais de cobrança. Acesso efetivo pela conta ainda precisa de verificação quando implementarmos. Fonte: [OpenAI — GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra), consultada em 13/09/2026.

Não adotaremos como metas comprovadas os relatos do autor de três segundos para notas, cinco para visão ou “centavos por dia”. Como exemplo aritmético, 100 chamadas com 2.000 tokens de entrada e 300 de saída faturados cada totalizam US$ 3,50 nesses preços-base, antes de imagens, ferramentas ou cobranças adicionais. O custo real deverá usar os dados de consumo retornados pelo serviço.

O título pergunta sobre AGI, mas a demonstração descrita não estabelece essa conclusão. O material mostra um modelo conectado a notas, sensores, interfaces e serviços. Comparações com outros modelos, data de lançamento e preços de ferramentas de terceiros não foram auditados nesta análise.

## O que podemos fazer com isso

- **Assistente dos projetos:** localizar decisões, dependências e anotações; responder “onde documentei isso?” com fonte.
- **Memória de trabalho:** registrar “lembre que decidimos...” e recuperar depois, com data e possibilidade de correção.
- **Apoio a conteúdo e cursos:** relacionar notas a ideias de aula, roteiros e pautas; inicialmente produzir rascunhos locais.
- **Ajuda contextual:** compartilhar um erro ou documento na tela e perguntar sobre ele.
- **Rotina de foco:** iniciar uma sessão, pausar, registrar desvios e consultar um resumo agregado.
- **Assistente remoto:** numa etapa posterior, consultar a mesma base pelo Telegram.
- **Automação documental:** numa etapa posterior, gerar documentos a partir de modelos e conectar os serviços realmente utilizados.

## Arquitetura proposta

Uma aplicação local com servidor Python, interface web e notas Markdown é suficiente como ponto de partida. Propomos módulos separados para indexação, recuperação, conversa, memória e provedores, sem concentrar toda a evolução em `server.py`. A interface começa com chat, fontes e navegação pelas notas; o grafo é outra maneira de explorar os mesmos dados.

As notas permanecem em uma pasta selecionada. Um índice local pode guardar metadados e busca; a primeira implementação pode usar busca por palavras, evoluindo apenas se os exemplos reais mostrarem necessidade. O histórico de conversa deve ser separado das memórias salvas explicitamente.

O servidor controla chamadas externas e configuração. Arquivos de configuração ficam fora da pasta pública. Capturas, ferramentas e sensores entram por interfaces separadas, com estado de disponibilidade. Uma falha na câmera não deve derrubar o chat.

O próximo passo concreto está no [plano de execução](plano-de-execucao.md): entregar a base pesquisável e a memória antes dos módulos de percepção e automação.
