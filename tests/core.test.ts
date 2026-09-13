import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../apps/server/store.js";
import { Secrets } from "../apps/server/secrets.js";
import { FocusService } from "../apps/server/services/focus.js";
import {
  publicAddress,
  detectMedia,
  MediaWorker,
} from "../apps/server/services/media.js";
const clean: (() => void)[] = [];
afterEach(() => {
  for (const f of clean.splice(0).reverse()) f();
});
function setup() {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-test-"));
  clean.push(() => rmSync(dir, { recursive: true, force: true }));
  const s = new Store(dir);
  clean.push(() => s.close());
  return s;
}
describe("Conhecimento e memória", () => {
  it("encontra palavras no corpo, revisa índice e remove sem citação obsoleta", () => {
    const s = setup();
    const n = s.putNote(
      "Decisão",
      "O curso começa com fotografia e iluminação.",
      "memory",
    );
    expect(s.search("iluminação")[0].id).toBe(n.id);
    s.putNote("Decisão", "Agora começa com pintura.", "memory", "", n.id);
    expect(s.search("iluminação")).toHaveLength(0);
    expect(s.search("pintura")[0].id).toBe(n.id);
    s.deleteNote(n.id);
    expect(s.search("pintura")).toHaveLength(0);
  });
  it("aceita aspas e operadores no texto sem executar FTS arbitrário", () => {
    const s = setup();
    s.putNote("Teste", "Teste de busca");
    expect(() => s.search('" OR * NEAR() <script>')).not.toThrow();
  });
  it("preserva IDs e memórias em outro processo de conexão ao banco", () => {
    const s = setup();
    const n = s.putNote("Lançamento", "Data decidida: outubro.", "memory");
    const another = new Store(s.dir);
    expect(another.note(n.id)?.content).toContain("outubro");
    another.close();
  });
});
it("segredos não entram no export e podem ser removidos", () => {
  const s = setup(),
    sec = new Secrets(s.dir);
  sec.set("kie", "segredo-de-teste");
  expect(sec.get("kie")).toBe("segredo-de-teste");
  expect(JSON.stringify(s.exportData())).not.toContain("segredo-de-teste");
  sec.set("kie", "");
  expect(sec.get("kie")).toBe("");
});
it("foco pausa e retoma sem coletar identidade de aplicativos", () => {
  const s = setup(),
    f = new FocusService(s);
  expect(f.start(25).remaining).toBe(1500);
  expect(f.action("pause").state).toBe("paused");
  expect(f.action("drift").drifts).toBe(1);
  expect(f.action("resume").state).toBe("running");
  expect(f.action("stop").state).toBe("stopped");
  expect(JSON.stringify(f.current())).not.toContain("hostname");
});
it("bloqueia endereços internos em downloads e detecta mídia real", () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "192.168.1.1",
    "172.16.1.1",
    "169.254.169.254",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
  ])
    expect(publicAddress(ip)).toBe(false);
  expect(publicAddress("8.8.8.8")).toBe(true);
  expect(() => detectMedia(Buffer.from("<html>erro</html>"))).toThrow();
});
it("não reenvia submissão de mídia incerta após reinício", async () => {
  const s = setup(),
    sec = new Secrets(s.dir);
  let requests = 0;
  const worker = new MediaWorker(s, sec, (async () => {
    requests++;
    throw new Error("não deve chamar");
  }) as any);
  const r = s.createRun("image", "kie", "grok-imagine/text-to-image", {
    prompt: "Teste",
  });
  s.updateRun(r.id, { state: "submitting" });
  await worker.process(s.run(r.id)!);
  expect(requests).toBe(0);
  expect(s.run(r.id)?.state).toBe("unknown");
});
it("retoma resultado remoto e baixa apenas uma vez", async () => {
  const s = setup(),
    sec = new Secrets(s.dir);
  sec.set("kie", "teste-credencial");
  let downloads = 0;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.alloc(20),
  ]);
  const worker = new MediaWorker(
    s,
    sec,
    (async () =>
      new Response(
        JSON.stringify({
          code: 200,
          data: {
            state: "success",
            resultJson: JSON.stringify({
              resultUrls: ["https://example.com/file.png"],
            }),
          },
        }),
      )) as any,
    async () => {
      downloads++;
      return png;
    },
  );
  const r = s.createRun("image", "kie", "grok-imagine/text-to-image", {
    prompt: "Teste",
  });
  s.updateRun(r.id, { state: "submitted", remote_id: "remote-1" });
  await worker.process(s.run(r.id)!);
  expect(s.run(r.id)?.state).toBe("succeeded");
  expect(s.assets()).toHaveLength(1);
  await worker.process(s.run(r.id)!);
  expect(downloads).toBe(1);
});

it("rejeita endereços IP literais privados antes de abrir uma conexão", async () => {
  const { download } = await import("../apps/server/services/media.js");
  await expect(download("https://127.0.0.1/test")).rejects.toThrow("Destino");
  await expect(download("https://[::1]/test")).rejects.toThrow("Destino");
});
