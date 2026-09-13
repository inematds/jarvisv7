# Jarvis v7

**[Guia público de uso](https://inematds.github.io/jarvisv7/guia/)** · [Versões](https://github.com/inematds/jarvisv7/releases)

Assistente pessoal local e base de referência para criar seu próprio Jarvis. Interface em português, conhecimento persistente e escolha de cérebro por conversa: **Codex OAuth, Claude OAuth ou OpenRouter API**. Imagens e vídeos pela **Kie**.

Esta entrega é a versão **0.1.0**. O [estado de implementação](docs/estado-da-implementacao.md) separa o que funciona do que ainda está no plano. O nome do projeto continua Jarvis v7; 0.1.0 é a versão do software.

## Instalar e abrir

Requer **Node.js 24** e npm. Para PDFs com texto, instale `pdftotext` (no Ubuntu/Debian: pacote `poppler-utils`). Codex e Claude são opcionais; instale os runtimes oficiais para usar essas contas.

```bash
git clone https://github.com/inematds/jarvisv7.git
cd jarvisv7
npm ci
npm run preflight
npm start
```

Abra **http://127.0.0.1:4700**. Escolha um perfil no primeiro acesso; as notas de exemplo são fictícias e opcionais. O servidor escuta apenas nesta máquina. Um celular precisa de uma instalação ou acesso remoto à máquina; a interface responsiva não abre a aplicação na rede.

Não é preciso configurar um serviço para explorar notas e a busca local, que devolve trechos e não produz respostas por IA.

## Escolher cérebro e módulos

1. Em **Configurações → Conexões**, conecte os serviços desejados.
2. **Codex:** use a conta ChatGPT do runtime oficial. Um login existente é reconhecido; o botão Conectar inicia o fluxo no navegador.
3. **Claude:** execute `claude auth login` no terminal. Habilite a integração pessoal em Cérebro; veja as [condições e limites de autenticação](docs/provedores-e-autenticacao.md).
4. **OpenRouter / Kie:** cole sua própria credencial no campo local do serviço. Os tokens OAuth dos CLIs não são lidos ou reutilizados como chaves de API.
5. Em **Cérebro**, selecione provedor, modelo e esforço. O catálogo Codex vem da instalação/conta; OpenRouter vem do serviço. Claude usa aliases oficiais do runtime.
6. No campo de conversa, clique no provedor para trocar o cérebro daquela conversa mantendo o histórico. O próximo provedor receberá o histórico limitado e as notas selecionadas.
7. Em **Preferências**, habilite voz, compartilhamento de tela, mídia e foco; ajuste a personalidade e o limite diário de pedidos de mídia.

Mais esforço pode consumir mais tempo e cota. Use `medium` para o cotidiano e aumente quando a tarefa exigir. Os valores disponíveis dependem do modelo.

## Usar

- Importe Markdown, TXT e PDFs textuais em **Conhecimento**; edite e remova documentos pela própria interface.
- Escreva **“Lembre que…”** para salvar uma memória de verdade. Revise em **Memórias**.
- Pergunte sobre os documentos. As fontes abrem o trecho preservado no momento da resposta, além de permitir abrir o documento atual.
- Consulte o **Histórico** da conversa, inclusive em telas pequenas.
- O mapa conecta referências por título e `[[links]]`; não infere relações semânticas.
- Compartilhe explicitamente a tela e envie um frame junto da pergunta a um modelo com visão. Não há observação contínua ou controle do computador.
- O microfone usa reconhecimento do navegador quando disponível, que pode depender de serviço remoto. A fala depende das vozes do navegador. Não é um modo de voz continuamente ativo.
- No **Estúdio**, escolha imagem/vídeo, confirme o consumo do provedor e acompanhe o trabalho. Arquivos gerados são baixados para sua biblioteca. Pedidos enviados à Kie não podem ser cancelados por esta interface.
- **Foco** é um temporizador manual persistente, com pausa e registro de distrações.

## Dados, backup e atualização

O banco SQLite, a biblioteca e as credenciais locais ficam em `data/`, fora do Git. `JARVIS_DATA_DIR` permite outra localização. Prefira caminho absoluto. A exportação JSON não contém credenciais e inclui notas, memórias, configurações e histórico; a importação da interface adiciona somente notas/memórias.

O snapshot da interface copia o banco com o servidor ativo. Para um backup de banco **e mídia**, pare o servidor e execute:

```bash
npm run backup -- --stopped
```

O comando informa a pasta criada e as instruções de restauração. Credenciais ficam fora desse backup; reconecte-as após restaurar. Para copiar credenciais manualmente, preserve as permissões e proteja também a chave local de criptografia.

Para uma instalação clonada de um repositório com releases, configure `JARVIS_RELEASE_REPO=inematds/jarvisv7` para consultar versões na interface. Para instalar uma tag publicada, com o servidor parado e o Git sem alterações:

```bash
npm run update -- v0.1.1 --stopped
```

`v0.1.1` é um exemplo, não uma release existente. O comando faz backup, busca a tag do seu `origin`, instala dependências e executa testes/build. Não reinicia o servidor. Em falha, informa a revisão anterior; a restauração do banco deve respeitar o schema. Personalizações de comportamento ficam nas configurações; mudanças no código devem ficar em sua branch e ser integradas conscientemente. Não há atualização automática em segundo plano.

O arquivo `.env.example` documenta opções; não é carregado automaticamente. Exporte as variáveis no shell ou use o mecanismo do seu gerenciador de processos.

## Desenvolver e contribuir

```bash
npm run dev       # servidor, porta 4700
npm run dev:web   # segundo terminal, interface em 5173
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

- `apps/server`: API local, armazenamento, fila e adaptadores.
- `apps/web`: aplicação React, estilos e componentes.
- `packages/shared`: tipos e preferências padrão.
- `scripts`: diagnóstico, backup e atualização.
- `tests`: regras de persistência, API, fila e navegador.
- `docs`: análise dos materiais, arquitetura, decisões e roteiro.
- [Guia de extensão](docs/como-estender.md): como adicionar um cérebro ou provedor de mídia.

Nunca envie `data/`, arquivos `.env` ou tokens em uma contribuição. Os materiais de terceiros recebidos em `docs/` são referências locais e estão excluídos da distribuição; este projeto não presume autorização para republicá-los.

## Licença

Código próprio sob [MIT](LICENSE). A licença não abrange os PDFs, transcrições e prompt packs de terceiros usados como referência, nem substitui as licenças das dependências.

## Resolver problemas

| Situação | O que fazer |
|---|---|
| `npm`/Node incompatível | Instale Node 24, execute `npm ci` e `npm run doctor`. |
| Porta ocupada | Encerre a instância antiga ou execute `PORT=4703 npm start`. Abra a mesma porta no navegador. |
| Codex/Claude ausente | Instale o CLI oficial do provedor e confira `codex --version` ou `claude --version`. Execute o login da sua conta. |
| Modelo indisponível | Atualize o runtime e escolha novamente um modelo no catálogo; a disponibilidade depende da conta. |
| Claude não responde | Confira `claude auth status`, o opt-in da integração e os limites da conta. |
| OpenRouter/Kie retorna erro | Confira credencial, saldo, modelo e os detalhes em Trabalhos. Credencial salva não é confirmação de saldo. |
| Mídia com submissão incerta | Confira o histórico da Kie antes de criar outro pedido; o anterior pode ter sido cobrado. |
| PDF sem texto | Execute OCR externamente ou use um PDF textual; a importação não faz OCR. |
| Mapa sem conexões | Inclua `[[Título exato]]` de outro documento em uma nota; a lista acessível permanece disponível. |
| Voz/tela indisponível | Confira permissões e suporte do navegador; use texto quando o recurso não estiver disponível. |
| Interface antiga após recompilar | Reinicie o servidor de produção e recarregue a página. |

Para restaurar um backup completo, pare o servidor, escolha uma pasta de dados **vazia**, copie para ela `jarvis.sqlite` e `assets/` do backup e inicie com `JARVIS_DATA_DIR=/caminho/da/pasta npm start`. Reconecte credenciais. Use a versão do software compatível com o schema do backup. Mantenha a pasta antiga até conferir a restauração.

## Documentação completa

O README é a entrada de instalação e operação. Os detalhes técnicos estão nos documentos abaixo; funções futuras estão identificadas como planejamento.

| Documento | Conteúdo |
|---|---|
| [Estado da implementação](docs/estado-da-implementacao.md) | Recursos entregues, limitações e o que ainda falta na versão 0.1.0 |
| [Autenticação e provedores](docs/provedores-e-autenticacao.md) | OAuth, APIs, condições de integração e referências oficiais |
| [Como estender](docs/como-estender.md) | Adicionar um cérebro, um provedor de mídia ou criar sua própria versão |
| [Configuração e atualizações](docs/configuracao-e-atualizacoes.md) | Visão planejada de perfis, configuração e evolução; consulte o estado para o suporte atual |
| [Arquitetura e contratos](docs/arquitetura-e-contratos.md) | Contratos e arquitetura de referência do plano completo |
| [Plano mestre](docs/plano-mestre-jarvis-v7.md) | Objetivo, escopo e decisões do projeto |
| [Roadmap e critérios](docs/roadmap-e-criterios.md) | Fases futuras e critérios de aceitação |
| [Análise consolidada](docs/analise-consolidada.md) | Síntese dos materiais que orientaram a base |
| [Validação 0.1.0](docs/validacao-0.1.0.md) | Testes executados, integração OAuth real, limites e revisão visual |
| [Produto](PRODUCT.md) e [design](DESIGN.md) | Intenção do produto e padrões da interface construída |
| [Changelog](CHANGELOG.md) | Histórico de versões |
| [Índice de docs](docs/README.md) | Documentos complementares e inventário histórico |

Os PDFs e prompt packs originais foram recebidos para análise local e não acompanham o clone público. Sua ausência não impede instalar, testar ou adaptar o aplicativo.
