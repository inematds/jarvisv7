import Fastify from "fastify";
import staticFiles from "@fastify/static";
import multipart from "@fastify/multipart";
import { z } from "zod";
import { resolve, join, extname, basename } from "node:path";
import {
  existsSync,
  chmodSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  rmSync,
  createReadStream,
} from "node:fs";
import { backup } from "node:sqlite";
import { randomUUID, createHash } from "node:crypto";
import { Store, id, now } from "./store.js";
import { Secrets } from "./secrets.js";
import { Brains } from "./providers/brains.js";
import { runProcess } from "./providers/process.js";
import { MediaWorker, mediaModels } from "./services/media.js";
import { FocusService } from "./services/focus.js";
import type { Brain, Settings } from "../../packages/shared/types.js";
export const VERSION = "0.1.0";
const brainSchema = z.enum(["local", "codex", "claude", "openrouter"]);
const noteSchema = z.object({
  title: z.string().trim().min(1).max(180),
  content: z.string().trim().min(1).max(150000),
  kind: z.enum(["note", "memory"]).default("note"),
});
const imageSchema = z
  .string()
  .max(4_000_000)
  .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/)
  .optional();
const settingsSchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    brain: brainSchema,
    model: z.string().max(150),
    effort: z.enum([
      "none",
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
      "max",
      "ultra",
    ]),
    persona: z.string().max(2000),
    voice: z.boolean(),
    preset: z.enum(["knowledge", "creative", "work", "custom"]),
    onboarded: z.boolean(),
    mediaEnabled: z.boolean(),
    focusEnabled: z.boolean(),
    screenEnabled: z.boolean(),
    claudeEnabled: z.boolean(),
    mediaMaxJobs: z.number().int().min(1).max(50),
    releaseChannel: z.enum(["stable", "preview"]),
  })
  .partial()
  .strict();
export async function buildApp(
  options: { dir?: string; startWorker?: boolean; brains?: Brains } = {},
) {
  const dir = resolve(options.dir ?? process.env.JARVIS_DATA_DIR ?? "data");
  const store = new Store(dir),
    secrets = new Secrets(dir),
    brains = options.brains ?? new Brains(dir, secrets),
    focus = new FocusService(store);
  const media = new MediaWorker(store, secrets);
  const controllers = new Map<string, AbortController>();
  const app = Fastify({
    logger: false,
    bodyLimit: 6_000_000,
    requestTimeout: 30000,
  });
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  });
  app.addHook("onRequest", async (req, reply) => {
    let host: string;
    try {
      host = new URL("http://" + req.headers.host).hostname;
    } catch {
      return reply.code(403).send({ error: "Host inválido." });
    }
    if (!["localhost", "127.0.0.1", "[::1]"].includes(host))
      return reply
        .code(403)
        .send({ error: "Esta instalação aceita apenas acesso local." });
    const origin = req.headers.origin;
    if (origin) {
      try {
        const u = new URL(origin);
        if (
          !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname) ||
          !["4700", "5173", String(process.env.PORT ?? 4700)].includes(
            u.port,
          ) ||
          u.protocol !== "http:"
        )
          return reply.code(403).send({ error: "Origem não permitida." });
      } catch {
        return reply.code(403).send({ error: "Origem inválida." });
      }
    }
    if (req.url.startsWith("/api/")) {
      reply.header("Cache-Control", "no-store");
      if (
        !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
        req.headers["x-jarvis-request"] !== "1"
      )
        return reply
          .code(403)
          .send({ error: "Solicitação sem proteção local." });
    }
  });
  app.addHook("onSend", async (req, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "no-referrer");
    reply.header("X-Frame-Options", "DENY");
    if (!req.url.startsWith("/api/"))
      reply.header(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'",
      );
    return payload;
  });
  app.setErrorHandler((error: any, _req, reply) => {
    if (error instanceof z.ZodError)
      return reply
        .code(400)
        .send({
          error: "Confira os campos informados.",
          details: error.issues.map((i: any) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        });
    const status =
      error.statusCode >= 400 && error.statusCode < 500
        ? error.statusCode
        : 400;
    return reply
      .code(status)
      .send({
        error:
          error.message?.slice(0, 350) ??
          "Não foi possível concluir. Tente novamente.",
      });
  });
  app.get("/api/health", () => ({
    ok: true,
    name: "Jarvis v7",
    version: VERSION,
    schema: 1,
  }));
  app.get("/api/settings", () => store.settings());
  app.patch("/api/settings", (req) => {
    const p = settingsSchema.parse(req.body);
    if (p.brain && p.brain !== store.settings().brain && !p.model) p.model = "";
    return store.saveSettings(p);
  });
  app.get("/api/connections", () =>
    brains.connections(store.settings().claudeEnabled),
  );
  app.post("/api/connections/codex/login", () => brains.codex.login());
  app.post("/api/connections/secret", (req) => {
    const b = z
      .object({
        provider: z.enum(["openrouter", "kie"]),
        value: z.string().trim().min(10).max(1000),
      })
      .parse(req.body);
    secrets.set(b.provider, b.value);
    return { ok: true };
  });
  app.delete("/api/connections/:provider", (req) => {
    const { provider } = req.params as any;
    if (["kie", "openrouter"].includes(provider)) secrets.set(provider, "");
    else if (provider === "claude")
      store.saveSettings({
        claudeEnabled: false,
        brain:
          store.settings().brain === "claude"
            ? "local"
            : store.settings().brain,
        model: "",
      });
    else if (provider === "codex")
      store.saveSettings({ brain: "local", model: "" });
    else throw new Error("Conexão desconhecida.");
    return {
      ok: true,
      detail:
        "Preferência local alterada. Sessões dos CLIs e credenciais de ambiente não são removidas.",
    };
  });
  app.get("/api/models", (req) =>
    brains.models(
      brainSchema.parse((req.query as any).provider ?? store.settings().brain),
    ),
  );
  app.get("/api/notes", (req) => {
    const q = String((req.query as any).q ?? "").slice(0, 1000);
    return q ? store.search(q, 100) : store.notes();
  });
  app.post("/api/notes", (req) => {
    const b = noteSchema.parse(req.body);
    return store.putNote(b.title, b.content, b.kind);
  });
  app.patch("/api/notes/:id", (req) => {
    const b = noteSchema.parse(req.body);
    return store.putNote(
      b.title,
      b.content,
      b.kind,
      "captura",
      (req.params as any).id,
    );
  });
  app.delete("/api/notes/:id", (req) => {
    store.deleteNote((req.params as any).id);
    return { ok: true };
  });
  app.post("/api/notes/import", async (req) => {
    const f = await req.file();
    if (!f) throw new Error("Selecione um arquivo.");
    const buffer = await f.toBuffer();
    const ext = extname(f.filename).toLowerCase();
    let content = "";
    if ([".md", ".txt"].includes(ext)) content = buffer.toString("utf8");
    else if (ext === ".pdf") {
      const tmp = join(dir, "import-" + randomUUID() + ".pdf");
      writeFileSync(tmp, buffer, { mode: 0o600 });
      try {
        content = await runProcess("pdftotext", ["-layout", tmp, "-"], {
          timeout: 20000,
        });
      } finally {
        rmSync(tmp, { force: true });
      }
    } else throw new Error("Use arquivos Markdown, TXT ou PDF textual.");
    if (!content.trim())
      throw new Error(
        "Arquivo sem texto. PDFs digitalizados precisam de OCR antes da importação.",
      );
    const b = noteSchema.parse({
      title: basename(f.filename, ext),
      content,
      kind: "note",
    });
    return store.putNote(
      b.title,
      b.content,
      b.kind,
      "importado: " + basename(f.filename),
    );
  });
  app.post("/api/notes/examples", () => {
    if (store.getMeta("examplesLoaded")) return { ok: true, already: true };
    for (const [title, content] of [
      [
        "Bem-vindo ao Jarvis v7",
        "Esta é uma nota de exemplo. O Jarvis v7 organiza conhecimento e memórias e permite escolher seu cérebro. A busca local não usa um LLM.",
      ],
      [
        "Projeto Aurora — exemplo fictício",
        "O Projeto Aurora é um exemplo fictício de curso de fotografia. A proposta inclui três aulas: iluminação, enquadramento e edição. O lançamento de demonstração está previsto para outubro.",
      ],
      [
        "Identidade visual — exemplo fictício",
        "Para o Projeto Aurora, a identidade de exemplo usa verde petróleo e papel claro. As capas devem mostrar luz natural e evitar texto pequeno. Esta referência é fictícia.",
      ],
      [
        "Minha rotina — exemplo fictício",
        "Uma sessão de foco de exemplo dura 25 minutos, seguida de uma pausa de 5 minutos. O Jarvis registra apenas tempo e distrações indicadas manualmente nesta versão.",
      ],
    ])
      store.putNote(title, content, "note", "exemplo fictício");
    store.setMeta("examplesLoaded", true);
    return { ok: true };
  });
  app.get("/api/graph", () => {
    const notes = store.notes();
    const nodes = notes.map((n) => ({
      id: n.id,
      name: n.title,
      group: n.kind,
    }));
    const links: any[] = [];
    for (let i = 0; i < notes.length; i++)
      for (let j = i + 1; j < notes.length; j++) {
        const a = notes[i],
          b = notes[j];
        if (
          a.content.toLowerCase().includes(b.title.toLowerCase()) ||
          b.content.toLowerCase().includes(a.title.toLowerCase()) ||
          [...a.content.matchAll(/\[\[([^\]]+)\]\]/g)].some((m) =>
            b.content.includes(m[0]),
          )
        )
          links.push({ source: a.id, target: b.id });
      }
    return { nodes, links };
  });
  app.get("/api/conversations", () => store.conversations());
  app.post("/api/conversations", (req) => {
    const b = z
      .object({
        title: z.string().trim().min(1).max(160).default("Nova conversa"),
      })
      .parse(req.body ?? {});
    const s = store.settings();
    return store.createConversation(b.title, s.brain, s.model);
  });
  app.get("/api/conversations/:id/messages", (req) =>
    store.messages((req.params as any).id),
  );
  app.patch("/api/conversations/:id", (req) => {
    const b = z
      .object({ brain: brainSchema, model: z.string().max(150) })
      .parse(req.body);
    const cid = (req.params as any).id;
    const active = store.db
      .prepare(
        "SELECT id FROM runs WHERE kind='chat' AND state IN ('queued','running') AND json_extract(input,'$.conversationId')=?",
      )
      .get(cid);
    if (active)
      throw new Error(
        "Aguarde ou interrompa o turno atual antes de trocar o cérebro.",
      );
    store.db
      .prepare("UPDATE conversations SET brain=?,model=? WHERE id=?")
      .run(b.brain, b.model, cid);
    return { ok: true };
  });
  app.post("/api/conversations/:id/turns", async (req) => {
    const b = z
      .object({
        message: z.string().trim().min(1).max(10000),
        image: imageSchema,
      })
      .parse(req.body);
    const cid = (req.params as any).id;
    const c = store.db
      .prepare("SELECT * FROM conversations WHERE id=?")
      .get(cid) as any;
    if (!c) throw new Error("Conversa não encontrada.");
    if (
      store.db
        .prepare(
          "SELECT id FROM runs WHERE kind='chat' AND state IN ('queued','running') AND json_extract(input,'$.conversationId')=?",
        )
        .get(cid)
    )
      throw new Error("Já há um turno em andamento nesta conversa.");
    if (b.image && !store.settings().screenEnabled)
      throw new Error("Ative a leitura de tela em Configurações.");
    const history = store.messages(cid);
    store.message(cid, "user", b.message);
    if (history.length === 0)
      store.db
        .prepare("UPDATE conversations SET title=? WHERE id=?")
        .run(b.message.slice(0, 65), cid);
    const r = store.createRun("chat", c.brain, c.model, {
      conversationId: cid,
      question: b.message,
      hasImage: !!b.image,
    });
    const controller = new AbortController();
    controllers.set(r.id, controller);
    store.updateRun(r.id, { state: "running" });
    const settings = store.settings();
    const notes = store.search(b.message);
    const model = c.model;
    void (async () => {
      try {
        const capture = b.message.match(
          /^(?:lembre(?:-se)? que|anote que|memorize(?: que)?)\s+([\s\S]+)/i,
        );
        let answer: string;
        let sources = notes;
        if (capture) {
          const n = store.putNote(
            capture[1].slice(0, 80),
            capture[1],
            "memory",
          );
          sources = [n];
          answer =
            "Memória salva: " + n.title + ". Você pode revisar em Memórias.";
        } else
          answer = await brains.answer({
            brain: c.brain,
            model,
            effort: settings.effort,
            question: b.message,
            history,
            notes,
            settings,
            image: b.image,
            signal: controller.signal,
            onText: (text) => {
              if (!controller.signal.aborted)
                store.event(r.id, "text", { text });
            },
          });
        if (controller.signal.aborted) return;
        const citations = sources
          .filter(
            (_, i) =>
              c.brain === "local" || capture || answer.includes(`[${i + 1}]`),
          )
          .map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content.slice(0, 5000),
          }));
        const message = store.message(cid, "assistant", answer, citations);
        store.updateRun(r.id, {
          state: "succeeded",
          output: { messageId: message.id },
        });
        store.event(r.id, "done", { messageId: message.id });
      } catch (e) {
        if (!controller.signal.aborted) {
          const error = e instanceof Error ? e.message : "Erro na conversa.";
          store.updateRun(r.id, { state: "failed", error });
          store.event(r.id, "error", { error });
        }
      } finally {
        controllers.delete(r.id);
      }
    })();
    return { runId: r.id };
  });
  app.get("/api/runs", () => store.runs());
  app.get("/api/runs/:id", (req) => {
    const r = store.run((req.params as any).id);
    if (!r) throw new Error("Trabalho não encontrado.");
    return r;
  });
  app.get("/api/runs/:id/events", (req) =>
    store.events(
      (req.params as any).id,
      Math.max(0, Number((req.query as any).after) || 0),
    ),
  );
  app.post("/api/runs/:id/cancel", (req) => {
    const rid = (req.params as any).id,
      r = store.run(rid);
    if (!r) throw new Error("Trabalho não encontrado.");
    if (["succeeded", "failed", "cancelled"].includes(r.state))
      return { ok: true };
    if (r.kind === "chat") {
      controllers.get(rid)?.abort();
      store.updateRun(rid, { state: "cancelled", error: null });
    } else if (r.state === "queued") {
      store.updateRun(rid, { state: "cancelled" });
    } else {
      throw new Error(
        "A Kie pode continuar gerando e cobrando. Cancelamento remoto não está disponível neste adaptador.",
      );
    }
    return { ok: true };
  });
  app.post("/api/runs/:id/reconcile", (req) => {
    const rid = (req.params as any).id,
      r = store.run(rid);
    if (!r || r.kind === "chat" || !r.remote_id)
      throw new Error(
        "Sem ID remoto para consultar. Confira o histórico do provedor; não reenviaremos o pedido.",
      );
    store.updateRun(rid, { state: "submitted", error: null });
    void media.tick();
    return { ok: true };
  });
  app.get("/api/media/models", () => mediaModels);
  app.post("/api/media/jobs", (req) => {
    const b = z
      .object({
        model: z.enum([
          "grok-imagine/text-to-image",
          "grok-imagine/text-to-video",
        ]),
        prompt: z.string().trim().min(5).max(8000),
        aspectRatio: z.enum(["1:1", "3:2", "2:3"]),
        confirmCost: z.literal(true),
        requestId: z.string().uuid(),
      })
      .parse(req.body);
    if (!store.settings().mediaEnabled)
      throw new Error("Ative o estúdio de mídia em Configurações.");
    if (!secrets.get("kie")) throw new Error("Conecte a Kie em Configurações.");
    if (b.model.endsWith("text-to-video") && b.aspectRatio === "1:1")
      throw new Error("Vídeo: escolha 3:2 ou 2:3.");
    const previous = store.getMeta("media:" + b.requestId);
    const hash = createHash("sha256").update(JSON.stringify(b)).digest("hex");
    if (previous) {
      if (previous.hash !== hash)
        throw new Error("Identificador reutilizado com outro pedido.");
      return { runId: previous.runId };
    }
    const count = (
      store.db
        .prepare(
          "SELECT count(*) n FROM runs WHERE kind!='chat' AND state!='cancelled' AND created_at>=?",
        )
        .get(now().slice(0, 10)) as any
    ).n;
    if (count >= store.settings().mediaMaxJobs)
      throw new Error(
        "Limite diário de pedidos atingido. Revise seu orçamento e ajuste em Configurações.",
      );
    const profile = mediaModels.find((m) => m.id === b.model)!;
    const r = store.createRun(profile.kind, "kie", b.model, b);
    store.setMeta("media:" + b.requestId, { hash, runId: r.id });
    void media.tick();
    return { runId: r.id };
  });
  app.get("/api/assets", () => store.assets());
  app.get("/api/assets/:id", async (req, reply) => {
    const a = store.db
      .prepare("SELECT * FROM assets WHERE id=?")
      .get((req.params as any).id) as any;
    if (!a) return reply.code(404).send({ error: "Arquivo não encontrado." });
    reply.type(a.mime);
    if ((req.query as any).download)
      reply.header(
        "Content-Disposition",
        `attachment; filename="${a.filename}"`,
      );
    return reply.send(createReadStream(join(dir, "assets", a.filename)));
  });
  app.get("/api/focus", () => focus.current());
  app.post("/api/focus", (req) => {
    if (!store.settings().focusEnabled)
      throw new Error("Ative foco em Configurações.");
    return focus.start(
      z.object({ minutes: z.number().int().min(1).max(240) }).parse(req.body)
        .minutes,
    );
  });
  app.post("/api/focus/action", (req) =>
    focus.action(
      z
        .object({
          action: z.enum(["pause", "resume", "stop", "drift", "extend"]),
        })
        .parse(req.body).action,
    ),
  );
  app.get("/api/export", async (_req, reply) => {
    reply.header(
      "Content-Disposition",
      'attachment; filename="jarvis-v7-export.json"',
    );
    return store.exportData();
  });
  app.post("/api/import", (req) => {
    const b = z
      .object({
        format: z.literal("jarvis-v7"),
        version: z.literal(1),
        notes: z
          .array(
            noteSchema.extend({
              id: z.string().uuid().optional(),
              source: z.string().optional(),
              created_at: z.string().optional(),
              updated_at: z.string().optional(),
            }),
          )
          .max(3000),
      })
      .parse(req.body);
    let count = 0;
    for (const n of b.notes) {
      if (
        store
          .notes()
          .some(
            (e) =>
              e.title === n.title &&
              e.content === n.content &&
              e.kind === n.kind,
          )
      )
        continue;
      store.putNote(n.title, n.content, n.kind, "importação de backup");
      count++;
    }
    return {
      ok: true,
      count,
      detail:
        "Notas e memórias importadas sem sobrescrever. Configurações, conversas e credenciais não são importadas por este fluxo.",
    };
  });
  app.post("/api/backup", async () => {
    const folder = join(dir, "backups");
    mkdirSync(folder, { recursive: true, mode: 0o700 });
    const name = "jarvis-" + Date.now() + ".sqlite";
    await backup(store.db, join(folder, name));
    chmodSync(join(folder, name), 0o600);
    return {
      ok: true,
      filename: name,
      detail:
        "Snapshot consistente do banco. Imagens e vídeos permanecem em data/assets; faça cópia dessa pasta para backup completo.",
    };
  });
  app.get("/api/backups", () => {
    const folder = join(dir, "backups");
    return existsSync(folder)
      ? readdirSync(folder).filter((f) => /^jarvis-\d+\.sqlite$/.test(f))
      : [];
  });
  app.get("/api/updates", async () => {
    const repo = process.env.JARVIS_RELEASE_REPO;
    if (!repo || !/^[-\w.]+\/[-\w.]+$/.test(repo))
      return {
        current: VERSION,
        configured: false,
        message:
          "Repositório de releases ainda não configurado. Atualização manual documentada.",
      };
    const res = await fetch(
      `https://api.github.com/repos/${repo}/releases${store.settings().releaseChannel === "stable" ? "/latest" : ""}`,
      {
        headers: { Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!res.ok)
      throw new Error(
        "Não foi possível consultar releases. A versão instalada foi preservada.",
      );
    const data: any = await res.json();
    const release = Array.isArray(data)
      ? data.find((r: any) => !r.draft)
      : data;
    return {
      current: VERSION,
      configured: true,
      latest: release?.tag_name ?? null,
      url: release?.html_url ?? null,
      notes: release?.body?.slice(0, 8000) ?? "",
      automatic: false,
    };
  });
  app.get("/api/diagnostics", () => ({
    version: VERSION,
    node: process.version,
    platform: process.platform,
    schema: 1,
    notes: store.notes().length,
    runs: store.runs().length,
    capabilities: {
      chat: true,
      memory: true,
      media: true,
      screen: true,
      focus: "manual",
      desktop: false,
      agnes: false,
      automaticUpdates: false,
    },
    activeRuns: controllers.size,
  }));
  const web = resolve("dist/web");
  if (existsSync(web)) {
    await app.register(staticFiles, {
      root: web,
      prefix: "/",
      wildcard: false,
    });
    app.setNotFoundHandler((req, reply) =>
      req.url.startsWith("/api/")
        ? reply.code(404).send({ error: "Rota não encontrada." })
        : reply.type("text/html").send(readFileSync(join(web, "index.html"))),
    );
  } else
    app.get("/", (_req, reply) =>
      reply
        .type("text/plain")
        .send(
          "Jarvis v7: execute npm run build e npm start. Desenvolvimento: npm run dev:web.",
        ),
    );
  app.addHook("onClose", async () => {
    await media.close();
    for (const c of controllers.values()) c.abort();
    brains.codex.close();
    await new Promise((r) => setTimeout(r, 100));
    store.close();
  });
  if (options.startWorker !== false) media.start();
  return { app, store, secrets, brains, media, focus };
}
