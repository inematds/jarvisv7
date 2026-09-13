import { spawnSync } from "node:child_process";
const tag = process.argv.find((a) =>
  /^v\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(a),
);
function git(args: string[], capture = false) {
  const r = spawnSync("git", args, {
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
  if (r.status !== 0) throw new Error("Git não concluiu: " + args[0]);
  return r.stdout?.trim() ?? "";
}
if (!tag || !process.argv.includes("--stopped"))
  throw new Error(
    "Pare o servidor. Uso: npm run update -- v0.1.1 --stopped. A versão deve existir como tag no origin escolhido por você.",
  );
if (git(["status", "--porcelain"], true))
  throw new Error(
    "Há alterações locais. Salve-as em commit antes de atualizar.",
  );
const before = git(["rev-parse", "HEAD"], true);
const backup = spawnSync(
  process.execPath,
  ["--import", "tsx", "scripts/backup.ts", "--stopped"],
  { stdio: "inherit" },
);
if (backup.status !== 0)
  throw new Error("Backup não concluído. Atualização interrompida.");
git(["fetch", "origin", "tag", tag]);
git(["switch", "--detach", tag]);
for (const args of [["ci"], ["run", "preflight"]]) {
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    stdio: "inherit",
  });
  if (r.status !== 0) {
    console.error(
      `Verificação falhou. Servidor continua parado. Para voltar: git switch --detach ${before}, npm ci e npm run build. A pasta de dados foi preservada.`,
    );
    process.exit(1);
  }
}
console.log(
  `Atualizado para ${tag}. Execute npm start. Revisão anterior: ${before}. Não substitua seu banco por uma versão antiga; use o backup quando a versão de schema exigir.`,
);
