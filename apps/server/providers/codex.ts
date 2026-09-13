import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanEnvironment, runProcess } from "./process.js";
import type { Model } from "../../../packages/shared/types.js";
export class CodexBridge {
  private process?: ChildProcessWithoutNullStreams;
  private seq = 0;
  private ready?: Promise<void>;
  private pending = new Map<
    number,
    {
      resolve: (v: any) => void;
      reject: (e: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private async start() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      const proc = spawn(
        "codex",
        [
          "app-server",
          "--stdio",
          "-c",
          "features.hooks=false",
          "-c",
          "features.apps=false",
        ],
        {
          cwd: this.cwd,
          env: cleanEnvironment(),
          stdio: ["pipe", "pipe", "pipe"],
          windowsHide: true,
        },
      );
      this.process = proc;
      const fail = () => {
        for (const p of this.pending.values()) {
          clearTimeout(p.timer);
          p.reject(
            new Error(
              "Codex indisponível. Verifique a instalação e a autenticação.",
            ),
          );
        }
        this.pending.clear();
        this.process = undefined;
        this.ready = undefined;
      };
      proc.on("error", fail);
      proc.on("exit", fail);
      proc.stdin.on("error", () => {});
      proc.stderr.on("data", () => {});
      createInterface({ input: proc.stdout }).on("line", (line) => {
        try {
          const msg = JSON.parse(line);
          if (msg.id != null && this.pending.has(msg.id)) {
            const p = this.pending.get(msg.id)!;
            clearTimeout(p.timer);
            this.pending.delete(msg.id);
            msg.error
              ? p.reject(
                  new Error(
                    "Codex rejeitou a solicitação. Verifique versão e sessão.",
                  ),
                )
              : p.resolve(msg.result);
          } else if (msg.id != null && msg.method) {
            proc.stdin.write(
              JSON.stringify({
                id: msg.id,
                error: {
                  code: -32601,
                  message: "Operação não habilitada neste cliente.",
                },
              }) + "\n",
            );
          }
        } catch {}
      });
      await this.raw("initialize", {
        clientInfo: { name: "jarvis_v7", title: "Jarvis v7", version: "0.1.0" },
      });
      proc.stdin.write(
        JSON.stringify({ method: "initialized", params: {} }) + "\n",
      );
    })();
    try {
      return await this.ready;
    } catch (e) {
      this.close();
      throw e;
    }
  }
  constructor(private cwd: string) {
    mkdirSync(cwd, { recursive: true, mode: 0o700 });
  }
  private raw(method: string, params: any = {}) {
    return new Promise<any>((resolve, reject) => {
      const id = ++this.seq;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Codex não respondeu a tempo."));
      }, 20000);
      this.pending.set(id, { resolve, reject, timer });
      this.process!.stdin.write(JSON.stringify({ id, method, params }) + "\n");
    });
  }
  async call(method: string, params: any = {}) {
    await this.start();
    return this.raw(method, params);
  }
  async status() {
    const r = await this.call("account/read", { refreshToken: false });
    return !!r.account && r.account.type === "chatgpt";
  }
  async models(): Promise<Model[]> {
    const r = await this.call("model/list", {
      limit: 100,
      includeHidden: false,
    });
    return r.data.map((m: any) => ({
      id: m.model ?? m.id,
      name: m.displayName ?? m.model ?? m.id,
      vision: m.inputModalities?.includes("image") ?? false,
      efforts: (m.supportedReasoningEfforts ?? []).map(
        (x: any) => x.reasoningEffort,
      ),
    }));
  }
  async login() {
    const r = await this.call("account/login/start", { type: "chatgpt" });
    if (!r.authUrl)
      throw new Error("O Codex não retornou o endereço de login.");
    const u = new URL(r.authUrl);
    if (
      !["auth.openai.com", "chatgpt.com", "auth0.openai.com"].includes(
        u.hostname,
      ) ||
      u.protocol !== "https:"
    )
      throw new Error("Endereço de login não reconhecido.");
    return { url: r.authUrl, loginId: r.loginId };
  }
  close() {
    this.process?.kill();
    this.process = undefined;
    this.ready = undefined;
  }
}
export async function codexAnswer(options: {
  cwd: string;
  prompt: string;
  model: string;
  effort: string;
  imagePath?: string;
  signal: AbortSignal;
  onText: (text: string) => void;
}) {
  const args = [
    "exec",
    "--ignore-user-config",
    "--ignore-rules",
    "--skip-git-repo-check",
    "--ephemeral",
    "--json",
    "--sandbox",
    "read-only",
    "-C",
    options.cwd,
    "-c",
    "project_doc_max_bytes=0",
    "-c",
    'web_search="disabled"',
  ];
  for (const f of [
    "shell_tool",
    "unified_exec",
    "apps",
    "hooks",
    "browser_use",
    "computer_use",
    "image_generation",
    "in_app_browser",
  ])
    args.push("-c", `features.${f}=false`);
  args.push(
    "-m",
    options.model,
    "-c",
    `model_reasoning_effort=${JSON.stringify(options.effort)}`,
  );
  if (options.imagePath) args.push("--image", options.imagePath);
  args.push("-");
  let result = "",
    failure = "";
  await runProcess("codex", args, {
    cwd: options.cwd,
    input: options.prompt,
    signal: options.signal,
    timeout: 180000,
    onLine: (line) => {
      try {
        const e = JSON.parse(line);
        if (e.type === "item.completed" && e.item?.type === "agent_message") {
          result = e.item.text;
          options.onText(result);
        }
        if (e.type === "turn.failed" || e.type === "error")
          failure =
            "Codex não concluiu o turno. Verifique o modelo e o limite da conta.";
      } catch {}
    },
  });
  if (failure || !result)
    throw new Error(failure || "Codex não retornou texto.");
  return result;
}
