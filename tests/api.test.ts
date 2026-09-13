import { it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildApp } from "../apps/server/app.js";
const clean: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const f of clean.splice(0).reverse()) await f();
});
async function setup() {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-api-"));
  const ctx = await buildApp({ dir, startWorker: false });
  clean.push(async () => {
    await ctx.app.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return ctx;
}
const headers = { host: "127.0.0.1:4700", "x-jarvis-request": "1" };
it("bloqueia host, origem e mutação sem header", async () => {
  const { app } = await setup();
  expect(
    (await app.inject({ url: "/api/settings", headers: { host: "evil.test" } }))
      .statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/notes",
        headers: { host: "localhost:4700" },
        payload: { title: "x", content: "x" },
      })
    ).statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        url: "/api/settings",
        headers: { ...headers, origin: "https://evil.test" },
      })
    ).statusCode,
  ).toBe(403);
});
it("conversa local recupera memória e referências sem inferência simulada", async () => {
  const { app, store } = await setup();
  await app.inject({
    method: "POST",
    url: "/api/notes",
    headers,
    payload: {
      title: "Curso",
      content: "O projeto Aurora terá fotografia.",
      kind: "memory",
    },
  });
  const c = (
    await app.inject({
      method: "POST",
      url: "/api/conversations",
      headers,
      payload: {},
    })
  ).json();
  const r = (
    await app.inject({
      method: "POST",
      url: `/api/conversations/${c.id}/turns`,
      headers,
      payload: { message: "Qual curso terá fotografia?" },
    })
  ).json();
  await new Promise((r) => setTimeout(r, 25));
  expect(store.run(r.runId)?.state).toBe("succeeded");
  const messages = (
    await app.inject({ url: `/api/conversations/${c.id}/messages`, headers })
  ).json();
  expect(messages[1].content).toContain("sem interpretação por IA");
  expect(messages[1].sources[0].title).toBe("Curso");
});
it("salva por comando e exporta notas sem credenciais", async () => {
  const { app } = await setup();
  const c = (
    await app.inject({
      method: "POST",
      url: "/api/conversations",
      headers,
      payload: {},
    })
  ).json();
  await app.inject({
    method: "POST",
    url: `/api/conversations/${c.id}/turns`,
    headers,
    payload: { message: "Lembre que decidimos lançar em outubro." },
  });
  const exported = (await app.inject({ url: "/api/export", headers })).json();
  expect(exported.notes[0].kind).toBe("memory");
  expect(exported.notes[0].content).toContain("outubro");
  expect(exported).not.toHaveProperty("secrets");
});
it("rejeita importação inválida e preserva dados existentes", async () => {
  const { app, store } = await setup();
  store.putNote("Real", "Dado real");
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/import",
        headers,
        payload: { format: "outro", notes: [] },
      })
    ).statusCode,
  ).toBe(400);
  expect(store.notes()).toHaveLength(1);
});
it("aplica limite e idempotência à geração", async () => {
  const { app, secrets, store } = await setup();
  store.saveSettings({ mediaEnabled: true, mediaMaxJobs: 1 });
  secrets.set("kie", "credencial-teste");
  const payload = {
    model: "grok-imagine/text-to-image",
    prompt: "Imagem de teste",
    aspectRatio: "1:1",
    confirmCost: true,
    requestId: crypto.randomUUID(),
  };
  const a = await app.inject({
    method: "POST",
    url: "/api/media/jobs",
    headers,
    payload,
  });
  const b = await app.inject({
    method: "POST",
    url: "/api/media/jobs",
    headers,
    payload,
  });
  expect(a.json().runId).toBe(b.json().runId);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/media/jobs",
        headers,
        payload: { ...payload, requestId: crypto.randomUUID() },
      })
    ).statusCode,
  ).toBe(400);
});
