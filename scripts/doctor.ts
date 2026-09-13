import { spawnSync } from "node:child_process";
import { existsSync, accessSync, constants } from "node:fs";
import { resolve } from "node:path";
const major = Number(process.versions.node.split(".")[0]);
console.log(
  `Jarvis v7 · diagnóstico\nNode: ${process.version} ${major === 24 ? "OK" : "use Node 24"}`,
);
for (const [bin, args] of [
  ["codex", ["--version"]],
  ["claude", ["--version"]],
  ["pdftotext", ["-v"]],
] as const) {
  const r = spawnSync(bin, [...args], { encoding: "utf8", timeout: 10000 });
  console.log(
    `${bin}: ${r.status === 0 ? "disponível" : "opcional, não encontrado"}`,
  );
}
console.log(
  `Interface compilada: ${existsSync("dist/web/index.html") ? "sim" : "não — execute npm run build"}`,
);
console.log(`Dados: ${resolve(process.env.JARVIS_DATA_DIR ?? "data")}`);
try {
  accessSync(".", constants.W_OK);
  console.log("Escrita na instalação: OK");
} catch {
  console.log("Escrita na instalação: indisponível");
  process.exitCode = 1;
}
if (major !== 24) process.exitCode = 1;
console.log(
  "OAuth: configure em Conexões. Nenhuma credencial é impressa neste diagnóstico.",
);
