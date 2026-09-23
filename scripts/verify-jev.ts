/** Explicit paid smoke test with fictional data; never uses personal notes. */
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { parseEnv } from "node:util";
import { buildApp } from "../apps/server/app.js";
if (!process.argv.includes("--live"))
  throw new Error(
    "Use --live para autorizar uma chamada paga com dados fictícios.",
  );
let key = process.env.OPENROUTER_API_KEY;
for (const project of ["openpcbotv2", "wifi"]) {
  if (key) break;
  try {
    key = parseEnv(
      readFileSync(join(homedir(), "projetos", project, ".env"), "utf8"),
    ).OPENROUTER_API_KEY;
  } catch {}
}
if (!key)
  throw new Error(
    "OPENROUTER_API_KEY ausente no ambiente e nos dois arquivos de referência.",
  );
process.env.OPENROUTER_API_KEY = key;
const dir = mkdtempSync(join(tmpdir(), "jarvis-jev-live-"));
const { app, store } = await buildApp({ dir, startWorker: false });
try {
  store.saveSettings({ reflexEnabled: true });
  store.putNote(
    "Marca Aurora — exemplo fictício",
    "Nossa voz nas redes sociais é clara e acolhedora.",
  );
  const c = store.createConversation("Teste sintético JEV", "local", "");
  const result = await app.inject({
    method: "POST",
    url: `/api/conversations/${c.id}/turns`,
    headers: { host: "127.0.0.1:4700", "x-jarvis-request": "1" },
    payload: {
      message:
        "Consulte minhas notas sobre a voz da marca Aurora nas redes sociais.",
    },
  });
  if (result.statusCode !== 200)
    throw new Error(`API status ${result.statusCode}`);
  let run;
  const deadline = Date.now() + 15000;
  do {
    await new Promise((r) => setTimeout(r, 100));
    run = store.run(result.json().runId);
  } while (run?.state === "running" && Date.now() < deadline);
  console.log(
    JSON.stringify({ state: run?.state, reflex: run?.output?.reflex }, null, 2),
  );
  if (run?.state !== "succeeded" || run?.output?.reflex?.source !== "jev")
    process.exitCode = 1;
} finally {
  await app.close();
  rmSync(dir, { recursive: true, force: true });
}
