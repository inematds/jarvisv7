import { DatabaseSync, backup } from "node:sqlite";
import {
  existsSync,
  mkdirSync,
  cpSync,
  chmodSync,
  writeFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
const dir = resolve(process.env.JARVIS_DATA_DIR ?? "data");
if (!existsSync(join(dir, "jarvis.sqlite")))
  throw new Error(
    "Banco não encontrado. Inicie o Jarvis antes do primeiro backup.",
  );
if (!process.argv.includes("--stopped"))
  throw new Error(
    "Encerre o servidor e execute npm run backup -- --stopped para uma cópia completa consistente com os arquivos de mídia. Com o servidor ligado, use o snapshot na interface.",
  );
const out = join(
  dir,
  "backups",
  "complete-" + new Date().toISOString().replace(/[:.]/g, "-"),
);
mkdirSync(out, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(join(dir, "jarvis.sqlite"), { readOnly: true });
await backup(db, join(out, "jarvis.sqlite"));
db.close();
chmodSync(join(out, "jarvis.sqlite"), 0o600);
if (existsSync(join(dir, "assets")))
  cpSync(join(dir, "assets"), join(out, "assets"), { recursive: true });
writeFileSync(
  join(out, "RESTORE.txt"),
  "Com o servidor parado, copie jarvis.sqlite e assets para uma pasta de dados vazia e configure JARVIS_DATA_DIR. Credenciais não estão neste backup; reconecte as APIs e os runtimes OAuth.\n",
  { mode: 0o600 },
);
console.log(
  "Backup completo de conhecimento, histórico e mídia (sem credenciais): " +
    out,
);
