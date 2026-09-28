# Jarvis v7

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

**[Public user guide](https://inematds.github.io/jarvisv7/guia/en/)** · [Releases](https://github.com/inematds/jarvisv7/releases)

Local personal assistant and reference foundation for creating your own Jarvis. Portuguese interface, persistent knowledge, and a choice of brain for each conversation: **Codex OAuth, Claude OAuth, or OpenRouter API**. Images and videos through **Kie**.

This release is version **0.2.0**. The [implementation status](docs/estado-da-implementacao.md) separates what works from what is still planned. The project name remains Jarvis v7; 0.1.0 is the software version.

## New: JEV Reflex — five decisions before the response

The **real JEV** guides the chat before the main brain: request destination,
completeness, whether it is directed to the assistant, need for action, and coverage by the notes.
Enable it under **Settings → Preferences → JEV · Reflex routing**, using your
OpenRouter connection. The Reflex panel shows the model, probabilities, latency, and reported cost.
API usage applies; if it fails, chat continues with an explicitly identified local fallback.

[How it works and its limits](docs/jev-reflex.md) ·
[Jarvis Modelo: reusable foundation with JEV](https://inematds.github.io/jarvismodelo/guia/)

## Install and open

Requires **Node.js 24** and npm. For PDFs with text, install `pdftotext` (on Ubuntu/Debian: the `poppler-utils` package). Codex and Claude are optional; install the official runtimes to use those accounts.

```bash
git clone https://github.com/inematds/jarvisv7.git
cd jarvisv7
npm ci
npm run preflight
npm start
```

Open **http://127.0.0.1:4700**. Choose a profile on your first visit; the sample notes are fictional and optional. The server listens only on this machine. A phone needs its own installation or remote access to the machine; the responsive interface does not make the application available on the network.

You don't need to configure a service to explore notes and local search, which returns excerpts and does not generate AI responses.

## Choose a brain and modules

1. Under **Settings → Connections**, connect the services you want.
2. **Codex:** use the official runtime's ChatGPT account. An existing login is recognized; the Connect button starts the flow in your browser.
3. **Claude:** run `claude auth login` in the terminal. Enable personal integration under Brain; see the [authentication terms and limits](docs/provedores-e-autenticacao.md).
4. **OpenRouter / Kie:** paste your own credential into the service's local field. OAuth tokens from CLIs are not read or reused as API keys.
5. Under **Brain**, select the provider, model, and effort. The Codex catalog comes from the installation/account; OpenRouter comes from the service. Claude uses official runtime aliases.
6. In the conversation field, click the provider to switch the brain for that conversation while keeping the history. The next provider receives the limited history and selected notes.
7. Under **Preferences**, enable voice, screen sharing, media, and focus; adjust the personality and daily limit for media requests.

More effort may use more time and quota. Use `medium` for everyday tasks and increase it when the task calls for it. Available values depend on the model.

## Use

- Import Markdown, TXT, and text-based PDFs under **Knowledge**; edit and remove documents in the interface.
- Write **“Remember that…”** to save an actual memory. Review it under **Memories**.
- Ask questions about documents. Sources open the excerpt preserved at the time of the response, and also let you open the current document.
- Browse the conversation **History**, including on small screens.
- The map connects references by title and `[[links]]`; it does not infer semantic relationships.
- Explicitly share your screen and send a frame with your question to a model with vision. There is no continuous observation or computer control.
- The microphone uses browser recognition when available, which may depend on a remote service. Speech depends on the browser's voices. This is not a continuously active voice mode.
- In **Studio**, choose image/video, confirm provider usage, and track the job. Generated files are downloaded to your library. Requests sent to Kie cannot be canceled through this interface.
- **Focus** is a persistent manual timer, with pause and distraction logging.

## Data, backup, and updates

The SQLite database, library, and local credentials are stored in `data/`, outside Git. `JARVIS_DATA_DIR` allows another location. Prefer an absolute path. The JSON export does not include credentials and contains notes, memories, settings, and history; importing through the interface adds notes/memories only.

The interface snapshot copies the database while the server is running. To back up the database **and media**, stop the server and run:

```bash
npm run backup -- --stopped
```

The command reports the folder it created and restoration instructions. Credentials are not included in this backup; reconnect them after restoring. To copy credentials manually, preserve their permissions and also protect the local encryption key.

For a cloned installation from a repository with releases, set `JARVIS_RELEASE_REPO=inematds/jarvisv7` to check for versions in the interface. To install a published tag, with the server stopped and Git with no changes:

```bash
npm run update -- v0.1.1 --stopped
```

`v0.1.1` is an example, not an existing release. The command creates a backup, fetches the tag from your `origin`, installs dependencies, and runs tests/build. It does not restart the server. If it fails, it reports the previous revision; database restoration must respect the schema. Behavior customizations belong in settings; code changes should stay on your branch and be integrated deliberately. There are no automatic background updates.

The `.env.example` file documents options; it is not loaded automatically. Export the variables in your shell or use your process manager's mechanism.

## Develop and contribute

```bash
npm run dev       # server, port 4700
npm run dev:web   # second terminal, interface on 5173
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

- `apps/server`: local API, storage, queue, and adapters.
- `apps/web`: React application, styles, and components.
- `packages/shared`: types and default preferences.
- `scripts`: diagnostics, backup, and updates.
- `tests`: persistence, API, queue, and browser rules.
- `docs`: analysis of materials, architecture, decisions, and roadmap.
- [Extension guide](docs/como-estender.md): how to add a brain or media provider.

Never include `data/`, `.env` files, or tokens in a contribution. Third-party materials received in `docs/` are local references and are excluded from the distribution; this project does not assume authorization to republish them.

## License

Original code under [MIT](LICENSE). The license does not cover third-party PDFs, transcripts, and prompt packs used as references, nor does it replace the licenses of dependencies.

## Troubleshooting

| Situation | What to do |
|---|---|
| Incompatible `npm`/Node | Install Node 24, run `npm ci` and `npm run doctor`. |
| Port in use | Stop the old instance or run `PORT=4703 npm start`. Open the same port in your browser. |
| Codex/Claude missing | Install the provider's official CLI and check `codex --version` or `claude --version`. Log in to your account. |
| Model unavailable | Update the runtime and choose a model again from the catalog; availability depends on the account. |
| Claude does not respond | Check `claude auth status`, the integration opt-in, and account limits. |
| OpenRouter/Kie returns an error | Check the credential, balance, model, and details under Jobs. A saved credential does not confirm available balance. |
| Media submission uncertain | Check Kie's history before creating another request; the previous one may have been charged. |
| PDF has no text | Run OCR externally or use a text-based PDF; importing does not perform OCR. |
| Map has no connections | Include `[[Exact title]]` from another document in a note; the accessible list remains available. |
| Voice/screen unavailable | Check browser permissions and support; use text when the feature is unavailable. |
| Old interface after rebuilding | Restart the production server and reload the page. |

To restore a complete backup, stop the server, choose an **empty** data folder, copy `jarvis.sqlite` and `assets/` from the backup into it, and start with `JARVIS_DATA_DIR=/path/to/folder npm start`. Reconnect credentials. Use the software version compatible with the backup schema. Keep the old folder until you have verified the restoration.

## Complete documentation

The README is the starting point for installation and operation. Technical details are in the documents below; future features are identified as planned.

| Document | Contents |
|---|---|
| [Implementation status](docs/estado-da-implementacao.md) | Delivered features, limitations, and what is still missing in version 0.1.0 |
| [Authentication and providers](docs/provedores-e-autenticacao.md) | OAuth, APIs, integration terms, and official references |
| [How to extend](docs/como-estender.md) | Add a brain or media provider, or create your own version |
| [Configuration and updates](docs/configuracao-e-atualizacoes.md) | Planned view of profiles, configuration, and evolution; see the status for current support |
| [Architecture and contracts](docs/arquitetura-e-contratos.md) | Contracts and reference architecture for the complete plan |
| [Master plan](docs/plano-mestre-jarvis-v7.md) | Project goals, scope, and decisions |
| [Roadmap and criteria](docs/roadmap-e-criterios.md) | Future phases and acceptance criteria |
| [Consolidated analysis](docs/analise-consolidada.md) | Summary of the materials that informed the foundation |
| [Validation 0.1.0](docs/validacao-0.1.0.md) | Tests run, real OAuth integration, limits, and visual review |
| [Product](PRODUCT.md) and [design](DESIGN.md) | Product intent and patterns for the interface that was built |
| [Changelog](CHANGELOG.md) | Version history |
| [Docs index](docs/README.md) | Supplementary documents and historical inventory |

The original PDFs and prompt packs were received for local analysis and are not included in the public clone. Their absence does not prevent installing, testing, or adapting the application.
