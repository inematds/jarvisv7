import {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  chmodSync,
} from "node:fs";
import { join } from "node:path";
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
export class Secrets {
  private key: Buffer;
  private file: string;
  constructor(dir: string) {
    const k = join(dir, "secrets.key");
    if (!existsSync(k))
      writeFileSync(k, randomBytes(32), { mode: 0o600, flag: "wx" });
    chmodSync(k, 0o600);
    this.key = readFileSync(k);
    this.file = join(dir, "secrets.enc");
  }
  private all(): Record<string, string> {
    if (!existsSync(this.file)) return {};
    const b = readFileSync(this.file);
    const d = createDecipheriv("aes-256-gcm", this.key, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([d.update(b.subarray(28)), d.final()]).toString(),
    );
  }
  get(name: string) {
    return (
      this.all()[name] ?? process.env[name.toUpperCase() + "_API_KEY"] ?? ""
    );
  }
  set(name: string, value: string) {
    const all = this.all();
    if (value) all[name] = value;
    else delete all[name];
    const iv = randomBytes(12),
      c = createCipheriv("aes-256-gcm", this.key, iv);
    const data = Buffer.concat([c.update(JSON.stringify(all)), c.final()]);
    writeFileSync(
      this.file + ".tmp",
      Buffer.concat([iv, c.getAuthTag(), data]),
      { mode: 0o600 },
    );
    renameSync(this.file + ".tmp", this.file);
  }
}
