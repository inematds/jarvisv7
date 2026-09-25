# Especificação — Jarvis no bolso (Telegram)

Status: **proposta**, ainda não implementada. Versão-alvo: **0.3.0**. Data: 25/09/2026.
Referências: prompt 11 do [prompt pack Opus 5.5](prompt-pack-opus-5-5.md) (e os prompts 12, 14 e 15, que usam este canal) e a [análise do vídeo](jarvis-claude-opus-5-5.md).

## 1. Objetivo

Conversar com o mesmo Jarvis da mesa pelo celular, com o notebook fechado ou longe, e receber os avisos da mesa como **texto e mensagem de voz**. O Telegram é o primeiro canal de saída do v7. A agenda, os lembretes e a telefonia vão confirmar por ele.

### Fora do escopo desta versão

- Grupos, canais e mais de um usuário: só **um chat pareado** por instalação.
- Webhook e túnel público: usa **long-polling** e não abre porta nenhuma.
- Ferramentas externas (Google, telefone): chegam em versões seguintes e reaproveitam o canal.
- Enviar arquivos da base ou mídias da Kie pelo Telegram (fica para depois).

## 2. Princípios (herdados do v7 e do pack)

1. **O chat pareado é o dono da instalação; todo o resto é estranho.** Um estranho recebe uma recusa curta, não gera nenhuma chamada paga (cérebro, STT, TTS) e nada do que ele manda é gravado como nota ou memória.
2. **Mesmo cérebro, mesmo contrato.** Uma mensagem do Telegram passa pelo mesmo turno da mesa: JEV Reflex, busca nas notas, cérebro e captura de memória. O cérebro não ganha ferramentas por vir do celular.
3. **Recibo ou não aconteceu.** O Jarvis só diz "enviado" com o `message_id` devolvido pelo Telegram.
4. **Entregar uma vez.** Cada envio tem uma chave de idempotência (`card_id`). A mesma chave nunca gera duas mensagens, nem depois de reiniciar o servidor.
5. **Segredos só no servidor.** O token do bot fica no `Secrets` (AES-GCM), nunca vai para o navegador e nunca aparece em log.
6. **O conteúdo que chega é dado, não instrução.** Texto e transcrição entram como pergunta do usuário, com as mesmas proteções do chat da mesa.

## 3. Visão geral

```
Telegram API ◄──long-poll getUpdates── TelegramService (apps/server/services/telegram.ts)
                                        │  pareamento / filtro de chat
                                        │  voz → STT → texto
                                        ▼
                                  runTurn()  ◄── também usado por POST /api/conversations/:id/turns
                                        │  (JEV → notas → cérebro → memória)
                                        ▼
                                  Outbox (tabela telegram_outbox)
                                        │  texto → sendMessage
                                        │  TTS → ffmpeg → OGG/Opus → sendVoice
                                        ▼
                                  Telegram API
```

- **Refatoração necessária:** a lógica que hoje está inline na rota `POST /api/conversations/:id/turns` (`apps/server/app.ts`) vira uma função `runTurn({conversationId, message, channel, image?, final?, addressed?, signal})`. A rota e o Telegram passam a chamar essa mesma função. O comportamento da mesa não muda, e os testes existentes têm que continuar passando.
- O serviço sobe junto com o Fastify (`buildApp`) só quando o módulo está ativo e há token. Ele para no `app.close()`.

## 4. Configuração e conexão

| Item | Onde fica | Observação |
|---|---|---|
| Token do bot (@BotFather) | `secrets.set("telegram", token)`, pela rota já existente `POST /api/connections/secret` | Validado com `getMe` antes de salvar. Guarda o `username` do bot |
| Ativação | `Settings.telegramEnabled: boolean` (padrão `false`) | Opt-in, como `claudeEnabled` e `reflexEnabled` |
| Voz na resposta | `Settings.telegramVoice: "off" \| "auto"` | `auto` manda voz quando há um provedor de TTS disponível |
| Provedor de STT | `Settings.sttProvider: "groq" \| "openai" \| "inemavox" \| "off"` | Chaves no `Secrets` (`groq`, `openai`). O inemavox é local, na porta 8010 |
| Provedor de TTS | `Settings.ttsProvider: "openai" \| "elevenlabs" \| "inemavox" \| "off"` | O TTS do navegador não serve: o áudio tem que ser gerado no servidor |
| Conversa usada | `meta.telegram_conversation_id` | Uma conversa fixa "Telegram", criada no pareamento com o cérebro e o modelo padrão da instalação |

Em Configurações → Conexões aparece um card **Telegram** com os estados `missing` (sem token), `pending` (token ok, sem par), `connected` (pareado) e `error`.

## 5. Pareamento

Máquina de estados guardada em `meta` (sobrevive a reinícios):

```
sem_par ──[mesa: "gerar código"]──► aguardando(código, expira_em, tentativas=0)
aguardando ──[mensagem == código, dentro do prazo]──► pareado(chat_id, user_id, desde)
aguardando ──[mensagem ≠ código]──► tentativas+1 ; se tentativas ≥ 5 → sem_par
aguardando ──[10 min]──► sem_par
pareado ──[mesa: "desparear"]──► sem_par
```

Regras:

- **O código só nasce na mesa:** pelo botão "Gerar código de pareamento" ou por voz ("Jarvis, código do bolso"). São 8 caracteres de `crypto.randomInt`, num alfabeto sem ambiguidades (sem 0/O e 1/I/l).
- **O código precisa ser a mensagem inteira** (depois de `trim`, sem diferenciar maiúsculas). Um código no meio de uma frase não vale.
- **Uso único:** depois do pareamento, o código é apagado. A comparação é em tempo constante (`timingSafeEqual`).
- **Só conversa privada** (`chat.type === "private"`). Grupo é sempre recusado.
- Como o código chega de volta pelo próprio Telegram, ele é conferido em cada mensagem recebida enquanto o estado é `aguardando`.
- O pareamento registra o `chat_id` e o `from.id`. Depois disso, uma mensagem só é aceita se **os dois** baterem.
- **Estranhos:** recebem **uma** resposta ("Este assistente é privado.") por `chat_id` a cada 24 h. Depois disso, silêncio. Nenhuma chamada de cérebro, STT ou TTS.
- **Trocar de celular:** desparear na mesa e gerar um novo código.

## 6. Mensagens recebidas

| Tipo | Tratamento |
|---|---|
| Texto | `runTurn(channel: "text", final: true, addressed: true)` na conversa do Telegram |
| Voz / áudio (`voice`, `audio`) | Baixa com `getFile` (limite de 20 MB da Bot API, com teto próprio de 5 min / 10 MB) → STT → `runTurn(channel: "voice", final: true, addressed: true)`. A transcrição é mostrada na resposta ("🎙 Você disse: …") para o usuário conferir |
| Foto | Só se `screenEnabled` e o modelo tiver visão: vai como `image` do turno. Senão, a resposta explica o motivo |
| Documento, sticker, localização, outros | Resposta curta: "Ainda não sei ler esse tipo de mensagem." |
| `/start`, `/help` | Mensagem fixa de ajuda, sem chamar o cérebro |
| `/pare` ou "pare" | Cancela o turno em andamento (mesmo mecanismo do `POST /api/runs/:id/cancel`) |

- **Um turno por vez**, como na mesa. Uma mensagem que chega com outro turno em andamento recebe "Ainda estou respondendo a anterior." e é descartada. Não entra em fila, para não haver respostas fora de ordem.
- Enquanto o turno roda, o Jarvis manda `sendChatAction: typing` (ou `record_voice` quando vai responder com voz).
- **Offset do long-poll:** o `update_id + 1` fica gravado em `meta.telegram_offset` **antes** de processar a mensagem. Uma mensagem pode se perder numa queda (aceitável), mas nunca é processada duas vezes.
- `getUpdates` com `timeout=30` e `allowed_updates=["message"]`. Em erro de rede, espera 1 s, 2 s, 4 s… até 60 s. Um erro `401` desativa o serviço e muda a conexão para `error` ("token inválido").

## 7. Respostas e entrega

### 7.1 Formato

- O texto sai **sem `parse_mode`**, como texto puro, para que conteúdo do modelo nunca vire formatação ou link injetado.
- Mensagens acima de 4.096 caracteres são divididas em partes em quebras de parágrafo.
- As fontes citadas vão numa linha final curta: "Fontes: Título A, Título B".
- **A voz é um resumo, não a resposta inteira:** até ~300 caracteres, começando pelo principal. As citações `[1]` e os símbolos são limpos. Valores são escritos para leitura em voz alta ("R$ 1.500" → "mil e quinhentos reais").

### 7.2 Voz (TTS → nota de voz)

1. O provedor configurado gera o áudio (mp3/wav).
2. O `ffmpeg` converte para **OGG/Opus mono 48 kHz** (`-c:a libopus -b:a 32k`). É o formato que o Telegram mostra como nota de voz.
3. O arquivo vai por `sendVoice` como resposta (`reply_to_message_id`) à mensagem de texto já enviada.
4. Se o TTS ou o ffmpeg falhar, a resposta **vai só em texto** e o erro fica registrado. O usuário nunca fica sem resposta por causa da voz.

### 7.3 Outbox (idempotência)

Tabela nova:

```sql
CREATE TABLE IF NOT EXISTS telegram_outbox(
  card_id TEXT PRIMARY KEY,          -- chave de idempotência (run id, lembrete id, …)
  kind TEXT NOT NULL,                -- reply | notify
  text TEXT NOT NULL,
  voice TEXT,                        -- linha curta para TTS, ou NULL
  state TEXT NOT NULL,               -- pending | sent_text | sent | failed
  text_message_id INTEGER,
  voice_message_id INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
```

- `enqueue(card_id, …)` usa `INSERT OR IGNORE`: a mesma chave nunca vira dois envios.
- O worker envia o texto e grava `text_message_id` (estado `sent_text`), depois envia a voz (estado `sent`). No reinício, retoma do estado gravado e não reenvia o texto.
- Até 3 tentativas com backoff, respeitando o `retry_after` do erro `429`. Depois disso, o estado vira `failed` e aparece na mesa.
- As respostas ao chat usam `card_id = run.id`.

### 7.4 Notificações da mesa (`notify`)

Uma API interna, `telegram.notify({cardId, text, voice?, priority})`, que os outros módulos chamam:

- **Nesta versão:** fim de um job de mídia da Kie ("Seu vídeo ficou pronto") e sessão de foco concluída, se o usuário ativar esses avisos em Configurações.
- **Próximas versões:** lembretes (prompt 15), confirmação depois da ligação (prompt 14) e aviso urgente com a linha armada (prompt 12).
- **Silêncio:** notificações `normal` respeitam uma janela configurável (padrão 22h–7h) e são guardadas até o fim dela. `urgent` ignora a janela.

## 8. API nova

| Rota | Função |
|---|---|
| `GET /api/telegram` | Estado: `enabled`, `bot`, `pairing` (`none` / `waiting`, com `expiresAt` / `paired`, com `since`), `stt`, `tts`, as últimas 20 entradas do outbox |
| `POST /api/telegram/pairing` | Gera o código e devolve `{code, expiresAt, botUrl}` (`https://t.me/<bot>`). Substitui um código pendente |
| `DELETE /api/telegram/pairing` | Despareia |
| `POST /api/telegram/test` | Manda "Teste do Jarvis ✓" + voz para o chat pareado e devolve os `message_id`s |
| `POST /api/telegram/outbox/:cardId/retry` | Reenvia um item `failed` |

Todas seguem as proteções atuais de `app.ts`: Host local, Origin local e `x-jarvis-request: 1` em métodos que alteram estado. A validação usa zod, como as demais rotas.

## 9. Interface na mesa

- **Card em Configurações → Conexões:** campo de token, estado, botão de pareamento. O código aparece em fonte grande com contagem regressiva e o link `t.me/<bot>`. Tem também "Enviar teste" e "Desparear".
- **Configurações → Telegram:** voz sim/não, STT, TTS, avisos (mídia, foco), janela de silêncio.
- **Conversa "Telegram"** no histórico, com um ícone de celular. As mensagens do celular aparecem ali e podem continuar na mesa.
- **Painel de saída:** as últimas entregas, com estado e botão "reenviar" nas que falharam.

## 10. Segurança — ameaças e respostas

| Ameaça | Resposta |
|---|---|
| Alguém descobre o bot e manda mensagem | Filtro por `chat_id` + `from.id`; recusa única; nenhuma chamada paga |
| Tentar adivinhar o código de pareamento | Código de ~40 bits, 10 min de validade, 5 tentativas, uso único, só em conversa privada |
| Token vazado | Fica só no `Secrets`; nunca vai ao navegador nem ao log. Para revogar, usar `/revoke` no BotFather e trocar o token na mesa |
| Conta do Telegram do dono comprometida | Mesmo risco de qualquer canal: o celular fala com o Jarvis. Mitigação: o cérebro continua **sem ferramentas** nesta versão. Nada que custe dinheiro ou apague dados sai do Telegram sem confirmação na mesa |
| Injeção de prompt via texto | Mesmas proteções do chat da mesa; a resposta sai como texto puro, sem `parse_mode` |
| Áudio gigante ou malicioso | Teto de duração e tamanho antes do STT; o `ffmpeg` roda com entrada limitada e timeout |
| Spam de envio (loop) | Outbox com chave única + limite de 30 mensagens de saída por hora (configurável) |

## 11. Testes e verificação

**Unitários (vitest):**
- pareamento: código correto, código dentro de frase, expirado, 5 erros, reuso, grupo;
- filtro de estranhos: recusa única e nenhuma chamada ao cérebro (mock);
- offset: nada é processado duas vezes depois de reiniciar;
- outbox: `INSERT OR IGNORE`, retomada de `sent_text`, `429` com `retry_after`;
- divisão de texto > 4.096 caracteres;
- limpeza para voz (citações, valores, símbolos);
- `runTurn` extraído: os testes da rota de turnos continuam passando.

**Preflight (`scripts/preflight.ts`), seção Telegram, só quando está ativo:**
- `getMe` responde;
- o chat está pareado;
- o TTS gera áudio e o `ffmpeg` converte para OGG/Opus;
- o STT transcreve um áudio de amostra (fixture curta);
- a flag `--dry` pula os envios reais.

**Aceite manual:**
1. Criar o bot, colar o token e parear pelo celular.
2. Mandar o texto "o que tenho anotado sobre X?" e receber texto com fontes + voz.
3. Mandar a nota de voz "lembre que o FINISH é 900 ms" e receber a transcrição, a confirmação da memória, e ver a nota nova na mesa.
4. Mandar mensagem de outra conta: recebe uma recusa, na segunda nada, e nenhuma run é criada.
5. Reiniciar o servidor no meio de um envio: a mensagem chega exatamente uma vez.

## 12. Entrega em fases

| Fase | Conteúdo | Pronto quando |
|---|---|---|
| A | `runTurn` extraído + serviço de long-poll + pareamento + texto de ida e volta | Aceites 1, 2 (sem voz) e 4 |
| B | Outbox idempotente + `sendChatAction` + divisão + `/pare` | Aceite 5 |
| C | STT (nota de voz recebida) | Aceite 3 |
| D | TTS → OGG → `sendVoice` + limpeza para voz | Aceite 2 completo |
| E | `notify` (mídia, foco) + janela de silêncio + painel de saída | Aviso de job Kie chega uma vez |

Cada fase fecha com o preflight passando. Ao final: `package.json` em **0.3.0**, entrada no CHANGELOG, e `estado-da-implementacao.md` e o guia atualizados.

## 13. Decisões em aberto

- **Provedor padrão de STT:** Groq (rápido, pago por uso) ou inemavox local (grátis, depende da GPU livre). Proposta: inemavox se `:8010` responder, senão Groq.
- **Provedor padrão de TTS:** inemavox (`chatterbox`, voz `rachel`) local ou OpenAI TTS. Proposta: inemavox, com o OpenAI como reserva.
- **Idioma da voz:** PT-BR fixo ou seguir o idioma da mensagem recebida.
- **Conversa única** "Telegram" ou uma nova por dia. Proposta: única, com o histórico limitado a 12 mensagens como já é hoje.
