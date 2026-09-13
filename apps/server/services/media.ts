import { request } from "node:https";
import { isIP } from "node:net";
import { lookup } from "node:dns";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { Store, id, now } from "../store.js";
import type { Secrets } from "../secrets.js";
import type { Run } from "../../../packages/shared/types.js";
export const mediaModels = [
  {
    id: "grok-imagine/text-to-image",
    name: "Grok Imagine · imagem",
    kind: "image",
  },
  {
    id: "grok-imagine/text-to-video",
    name: "Grok Imagine · vídeo",
    kind: "video",
  },
] as const;
export function publicAddress(ip: string) {
  if (ip.includes(":"))
    return /^2[0-9a-f]{3}:/i.test(ip) && !/^2001:db8:/i.test(ip);
  const n = ip.split(".").map(Number);
  return (
    n.length === 4 &&
    n.every((x) => Number.isInteger(x) && x >= 0 && x <= 255) &&
    ![0, 10, 127, 169].includes(n[0]) &&
    n[0] < 224 &&
    !(n[0] === 172 && n[1] >= 16 && n[1] <= 31) &&
    !(n[0] === 192 && (n[1] === 168 || n[1] === 0)) &&
    !(n[0] === 100 && n[1] >= 64 && n[1] <= 127) &&
    !(n[0] === 198 && (n[1] === 18 || n[1] === 19))
  );
}
export function download(
  url: string,
  redirects = 0,
  signal?: AbortSignal,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      (u.port && u.port !== "443") ||
      redirects > 3
    )
      return reject(new Error("URL de mídia inválida."));
    const literal = u.hostname.replace(/^\[|\]$/g, "");
    if (isIP(literal) && !publicAddress(literal))
      return reject(new Error("Destino de download não permitido."));
    const req = request(
      u,
      {
        signal,
        lookup: ((hostname: any, options: any, cb: any) => {
          lookup(hostname, { all: true }, (err, addresses) => {
            if (
              err ||
              !addresses.length ||
              addresses.some((a) => !publicAddress(a.address))
            )
              return cb(new Error("Destino de download não permitido."));
            if (options?.all) cb(null, addresses);
            else cb(null, addresses[0].address, addresses[0].family);
          });
        }) as any,
      },
      (res) => {
        if (
          res.statusCode &&
          [301, 302, 303, 307, 308].includes(res.statusCode) &&
          res.headers.location
        ) {
          res.resume();
          download(
            new URL(res.headers.location, u).href,
            redirects + 1,
            signal,
          ).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(
            new Error(
              "Download indisponível. É possível tentar baixar novamente.",
            ),
          );
          return;
        }
        const chunks: Buffer[] = [];
        let bytes = 0;
        res.on("data", (b: Buffer) => {
          bytes += b.length;
          if (bytes > 100 * 1024 * 1024) {
            req.destroy(new Error("Arquivo excede 100 MB."));
            return;
          }
          chunks.push(b);
        });
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      },
    );
    const deadline = setTimeout(
      () => req.destroy(new Error("Download excedeu o tempo limite.")),
      45000,
    );
    req.on("close", () => clearTimeout(deadline));
    req.on("error", reject);
    req.end();
  });
}
export function detectMedia(b: Buffer) {
  if (b.length < 12) throw new Error("Arquivo de mídia vazio ou inválido.");
  if (b[0] === 0xff && b[1] === 0xd8) return { ext: "jpg", mime: "image/jpeg" };
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return { ext: "png", mime: "image/png" };
  if (
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  )
    return { ext: "webp", mime: "image/webp" };
  if (b.toString("ascii", 4, 8) === "ftyp")
    return { ext: "mp4", mime: "video/mp4" };
  throw new Error("Formato de arquivo não reconhecido.");
}
export class MediaWorker {
  private timer?: ReturnType<typeof setInterval>;
  private busy = new Set<string>();
  private next = new Map<string, number>();
  private closed = true;
  private shutdown = new AbortController();
  private pending = new Set<Promise<void>>();
  constructor(
    private store: Store,
    private secrets: Secrets,
    private apiFetch: typeof fetch = fetch,
    private downloadFile = download,
  ) {
    mkdirSync(join(store.dir, "assets"), { recursive: true, mode: 0o700 });
  }
  start() {
    this.closed = false;
    this.timer = setInterval(() => {
      void this.tick();
    }, 4000);
    this.timer.unref();
    void this.tick();
  }
  async close() {
    this.closed = true;
    this.shutdown.abort();
    if (this.timer) clearInterval(this.timer);
    await Promise.allSettled(this.pending);
  }
  async tick() {
    if (this.closed) return;
    const jobs = this.store
      .activeMedia()
      .filter(
        (r) =>
          r.kind !== "chat" &&
          [
            "queued",
            "submitting",
            "submitted",
            "processing",
            "downloading",
          ].includes(r.state),
      );
    for (const r of jobs) {
      if (this.closed || this.busy.size >= 2) break;
      if (this.busy.has(r.id) || (this.next.get(r.id) ?? 0) > Date.now())
        continue;
      this.busy.add(r.id);
      const task = this.process(r).finally(() => {
        this.busy.delete(r.id);
        this.pending.delete(task);
      });
      this.pending.add(task);
    }
  }
  private async api(path: string, body?: any) {
    const key = this.secrets.get("kie");
    if (!key) throw new Error("Conecte sua credencial Kie para continuar.");
    const res = await this.apiFetch("https://api.kie.ai/api/v1/" + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.any([
        this.shutdown.signal,
        AbortSignal.timeout(30000),
      ]),
    });
    if (!res.ok)
      throw new Error(
        `Kie respondeu ${res.status}. Verifique credencial e saldo.`,
      );
    const data: any = await res.json();
    if (data.code !== 200)
      throw new Error(
        "Kie não confirmou a operação. Verifique saldo, modelo e parâmetros.",
      );
    return data.data;
  }
  async process(r: Run) {
    try {
      if (r.state === "submitting" && !r.remote_id) {
        this.store.updateRun(r.id, {
          state: "unknown",
          error:
            "Submissão sem confirmação após reinício. Confira o histórico na Kie antes de criar outro pedido.",
        });
        return;
      }
      if (r.state === "queued") {
        if (this.store.run(r.id)?.state !== "queued") return;
        this.store.updateRun(r.id, { state: "submitting" });
        const input: any = {
          prompt: r.input.prompt,
          aspect_ratio: r.input.aspectRatio,
        };
        if (r.kind === "video")
          Object.assign(input, {
            mode: "normal",
            duration: "6",
            resolution: "480p",
          });
        const remote = await this.api("jobs/createTask", {
          model: r.model,
          input,
        });
        if (!remote?.taskId)
          throw new Error("Submissão sem identificador remoto.");
        this.store.updateRun(r.id, {
          state: "submitted",
          remote_id: remote.taskId,
          error: null,
        });
        this.store.event(r.id, "status", { state: "submitted" });
        this.next.set(r.id, Date.now() + 5000);
        return;
      }
      if (!r.remote_id) throw new Error("Trabalho sem identificador remoto.");
      const data = await this.api(
        "jobs/recordInfo?taskId=" + encodeURIComponent(r.remote_id),
      );
      if (data.state === "fail") {
        this.store.updateRun(r.id, {
          state: "failed",
          error: "A geração falhou na Kie. Consulte o histórico do provedor.",
        });
        return;
      }
      if (data.state !== "success") {
        this.store.updateRun(r.id, { state: "processing", error: null });
        this.next.set(r.id, Date.now() + 10000);
        return;
      }
      const payload =
        typeof data.resultJson === "string"
          ? JSON.parse(data.resultJson)
          : data.resultJson;
      const urls = payload?.resultUrls;
      if (!Array.isArray(urls) || urls.length === 0 || urls.length > 12)
        throw new Error("Kie retornou uma lista de arquivos inválida.");
      this.store.updateRun(r.id, {
        state: "downloading",
        output: { count: urls.length },
      });
      for (let i = 0; i < urls.length; i++) {
        const assetId = r.id + "-" + i;
        const found = this.store.db
          .prepare("SELECT id FROM assets WHERE id=?")
          .get(assetId);
        if (found) continue;
        const buffer = await this.downloadFile(
          urls[i],
          0,
          this.shutdown.signal,
        );
        const type = detectMedia(buffer);
        if (!type.mime.startsWith(r.kind === "image" ? "image/" : "video/"))
          throw new Error("O tipo de arquivo não corresponde ao pedido.");
        const filename = assetId + "." + type.ext;
        writeFileSync(join(this.store.dir, "assets", filename), buffer, {
          mode: 0o600,
        });
        this.store.db
          .prepare("INSERT INTO assets VALUES (?,?,?,?,?,?,?)")
          .run(
            assetId,
            r.id,
            filename,
            type.mime,
            buffer.length,
            createHash("sha256").update(buffer).digest("hex"),
            now(),
          );
      }
      this.store.updateRun(r.id, {
        state: "succeeded",
        output: { count: urls.length },
        error: null,
      });
      this.store.event(r.id, "done", { count: urls.length });
    } catch (e) {
      const current = this.store.run(r.id)!;
      const message =
        e instanceof Error ? e.message : "Falha ao processar mídia.";
      if (current.state === "submitting" && !current.remote_id)
        this.store.updateRun(r.id, {
          state: "unknown",
          error:
            "Não foi possível confirmar a submissão. Confira a Kie antes de repetir; o pedido pode ter sido cobrado.",
        });
      else
        this.store.updateRun(r.id, {
          state: "needs_attention",
          error: message,
        });
    }
  }
}
