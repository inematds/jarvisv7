import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  defaults,
  type Settings,
  type Note,
  type Run,
} from "../../packages/shared/types.js";
export const now = () => new Date().toISOString();
export const id = () => randomUUID();
export class Store {
  db: DatabaseSync;
  constructor(public dir: string) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    chmodSync(dir, 0o700);
    this.db = new DatabaseSync(join(dir, "jarvis.sqlite"));
    this.db
      .exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY,title TEXT NOT NULL,content TEXT NOT NULL,kind TEXT NOT NULL,source TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(id UNINDEXED,title,content,tokenize='unicode61 remove_diacritics 2');
  CREATE TABLE IF NOT EXISTS conversations(id TEXT PRIMARY KEY,title TEXT NOT NULL,brain TEXT NOT NULL,model TEXT NOT NULL,created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,role TEXT NOT NULL,content TEXT NOT NULL,sources TEXT NOT NULL DEFAULT '[]',created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,kind TEXT NOT NULL,state TEXT NOT NULL,provider TEXT NOT NULL,model TEXT NOT NULL,input TEXT NOT NULL,output TEXT NOT NULL DEFAULT '{}',error TEXT,remote_id TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT,run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,type TEXT NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES runs(id),filename TEXT NOT NULL,mime TEXT NOT NULL,bytes INTEGER NOT NULL,sha256 TEXT NOT NULL,created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS focus(id TEXT PRIMARY KEY,state TEXT NOT NULL,planned_seconds INTEGER NOT NULL,elapsed_seconds INTEGER NOT NULL DEFAULT 0,started_ms INTEGER,drifts INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
  `);
    chmodSync(join(dir, "jarvis.sqlite"), 0o600);
    const version = this.getMeta("schema");
    if (version && version !== 1)
      throw new Error(
        "Versão de banco incompatível. Restaure o backup com a versão correspondente.",
      );
    this.setMeta("schema", 1);
    this.db
      .prepare(
        "UPDATE runs SET state='interrupted',error='Servidor reiniciado durante a conversa.',updated_at=? WHERE kind='chat' AND state IN ('queued','running')",
      )
      .run(now());
  }
  getMeta(key: string): any {
    const r = this.db
      .prepare("SELECT value FROM meta WHERE key=?")
      .get(key) as any;
    return r ? JSON.parse(r.value) : null;
  }
  setMeta(key: string, value: any) {
    this.db
      .prepare(
        "INSERT INTO meta VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .run(key, JSON.stringify(value));
  }
  settings(): Settings {
    return { ...defaults, ...this.getMeta("settings") };
  }
  saveSettings(value: Partial<Settings>) {
    const merged = { ...this.settings(), ...value };
    this.setMeta("settings", merged);
    return merged;
  }
  transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  notes(): Note[] {
    return this.db
      .prepare("SELECT * FROM notes ORDER BY updated_at DESC")
      .all() as unknown as Note[];
  }
  note(noteId: string): Note | undefined {
    return this.db
      .prepare("SELECT * FROM notes WHERE id=?")
      .get(noteId) as unknown as Note | undefined;
  }
  putNote(
    title: string,
    content: string,
    kind: "note" | "memory" = "note",
    source = "captura",
    noteId?: string,
  ): Note {
    const existing = noteId ? this.note(noteId) : undefined;
    if (noteId && !existing) throw new Error("Nota não encontrada.");
    const n: Note = {
      id: noteId ?? id(),
      title,
      content,
      kind,
      source: existing?.source ?? source,
      created_at: existing?.created_at ?? now(),
      updated_at: now(),
    };
    this.transaction(() => {
      this.db
        .prepare(
          "INSERT INTO notes VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,content=excluded.content,kind=excluded.kind,updated_at=excluded.updated_at",
        )
        .run(
          n.id,
          n.title,
          n.content,
          n.kind,
          n.source,
          n.created_at,
          n.updated_at,
        );
      this.db.prepare("DELETE FROM notes_fts WHERE id=?").run(n.id);
      this.db
        .prepare("INSERT INTO notes_fts(id,title,content) VALUES (?,?,?)")
        .run(n.id, n.title, n.content);
    });
    return n;
  }
  deleteNote(noteId: string) {
    this.transaction(() => {
      this.db.prepare("DELETE FROM notes WHERE id=?").run(noteId);
      this.db.prepare("DELETE FROM notes_fts WHERE id=?").run(noteId);
    });
  }
  search(query: string, limit = 6): Note[] {
    const stop = new Set([
      "sobre",
      "para",
      "como",
      "quais",
      "qual",
      "onde",
      "isso",
      "esta",
      "este",
      "uma",
      "das",
      "dos",
      "que",
      "com",
      "nos",
      "meu",
      "minha",
      "você",
      "voce",
    ]);
    const words = [
      ...new Set(query.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []),
    ]
      .filter((w) => !stop.has(w))
      .slice(0, 24);
    if (!words.length) return [];
    return this.db
      .prepare(
        "SELECT n.* FROM notes_fts f JOIN notes n ON f.id=n.id WHERE notes_fts MATCH ? ORDER BY bm25(notes_fts,0,8,1) LIMIT ?",
      )
      .all(
        words.map((w) => '"' + w + '"*').join(" OR "),
        limit,
      ) as unknown as Note[];
  }
  conversations() {
    return this.db
      .prepare("SELECT * FROM conversations ORDER BY created_at DESC")
      .all();
  }
  createConversation(title: string, brain: string, model: string) {
    const c = { id: id(), title, brain, model, created_at: now() };
    this.db
      .prepare("INSERT INTO conversations VALUES (?,?,?,?,?)")
      .run(c.id, c.title, c.brain, c.model, c.created_at);
    return c;
  }
  messages(conversationId: string) {
    return this.db
      .prepare("SELECT * FROM messages WHERE conversation_id=? ORDER BY rowid")
      .all(conversationId)
      .map((m: any) => ({ ...m, sources: JSON.parse(m.sources) }));
  }
  message(
    conversationId: string,
    role: string,
    content: string,
    sources: any[] = [],
  ) {
    const m = {
      id: id(),
      conversation_id: conversationId,
      role,
      content,
      sources,
      created_at: now(),
    };
    this.db
      .prepare("INSERT INTO messages VALUES (?,?,?,?,?,?)")
      .run(
        m.id,
        conversationId,
        role,
        content,
        JSON.stringify(sources),
        m.created_at,
      );
    return m;
  }
  createRun(kind: Run["kind"], provider: string, model: string, input: any) {
    const r: Run = {
      id: id(),
      kind,
      state: "queued",
      provider,
      model,
      input,
      output: {},
      error: null,
      remote_id: null,
      created_at: now(),
      updated_at: now(),
    };
    this.db
      .prepare("INSERT INTO runs VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      .run(
        r.id,
        kind,
        r.state,
        provider,
        model,
        JSON.stringify(input),
        "{}",
        null,
        null,
        r.created_at,
        r.updated_at,
      );
    return r;
  }
  decodeRun(r: any): Run {
    return { ...r, input: JSON.parse(r.input), output: JSON.parse(r.output) };
  }
  run(runId: string): Run | undefined {
    const r = this.db.prepare("SELECT * FROM runs WHERE id=?").get(runId);
    return r ? this.decodeRun(r) : undefined;
  }
  activeMedia() {
    return this.db
      .prepare(
        "SELECT * FROM runs WHERE kind!='chat' AND state IN ('queued','submitting','submitted','processing','downloading') ORDER BY created_at ASC",
      )
      .all()
      .map((r) => this.decodeRun(r));
  }
  runs() {
    return this.db
      .prepare("SELECT * FROM runs ORDER BY created_at DESC LIMIT 100")
      .all()
      .map((r) => this.decodeRun(r));
  }
  updateRun(runId: string, patch: Partial<Run>) {
    const r = this.run(runId);
    if (!r) return;
    Object.assign(r, patch);
    this.db
      .prepare(
        "UPDATE runs SET state=?,output=?,error=?,remote_id=?,updated_at=? WHERE id=?",
      )
      .run(
        r.state,
        JSON.stringify(r.output),
        r.error,
        r.remote_id,
        now(),
        runId,
      );
  }
  event(runId: string, type: string, data: any) {
    this.db
      .prepare(
        "INSERT INTO events(run_id,type,data,created_at) VALUES (?,?,?,?)",
      )
      .run(runId, type, JSON.stringify(data), now());
  }
  events(runId: string, after = 0) {
    return this.db
      .prepare(
        "SELECT * FROM events WHERE run_id=? AND seq>? ORDER BY seq LIMIT 500",
      )
      .all(runId, after)
      .map((e: any) => ({ ...e, data: JSON.parse(e.data) }));
  }
  assets() {
    return this.db
      .prepare("SELECT * FROM assets ORDER BY created_at DESC")
      .all();
  }
  exportData() {
    return {
      format: "jarvis-v7",
      version: 1,
      createdAt: now(),
      settings: { ...this.settings(), onboarded: false },
      notes: this.notes(),
      conversations: this.conversations(),
      messages: this.db
        .prepare("SELECT * FROM messages ORDER BY rowid")
        .all()
        .map((m: any) => ({ ...m, sources: JSON.parse(m.sources) })),
    };
  }
  close() {
    this.db.close();
  }
}
