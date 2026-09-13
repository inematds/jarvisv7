import { spawn } from "node:child_process";
export function cleanEnvironment() {
  const env = { ...process.env };
  for (const k of [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN",
    "OPENAI_BASE_URL",
    "ANTHROPIC_BASE_URL",
    "CLAUDECODE",
    "CLAUDE_CODE_ENTRYPOINT",
  ])
    delete env[k];
  return env;
}
export function runProcess(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    input?: string;
    signal?: AbortSignal;
    timeout?: number;
    onLine?: (line: string) => void;
    env?: NodeJS.ProcessEnv;
  } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? cleanEnvironment(),
      stdio: ["pipe", "pipe", "pipe"],
      detached: process.platform !== "win32",
      windowsHide: true,
    });
    let output = "",
      pending = "",
      stderr = "",
      settled = false;
    const kill = () => {
      try {
        if (process.platform !== "win32" && proc.pid)
          process.kill(-proc.pid, "SIGTERM");
        else proc.kill();
      } catch {}
      setTimeout(() => {
        try {
          if (proc.exitCode !== null || proc.signalCode !== null) return;
          if (process.platform !== "win32" && proc.pid)
            process.kill(-proc.pid, "SIGKILL");
          else proc.kill("SIGKILL");
        } catch {}
      }, 1200).unref();
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      error ? reject(error) : resolve(output);
    };
    const abort = () => {
      kill();
      finish(new Error("Operação interrompida."));
    };
    const timer = setTimeout(() => {
      kill();
      finish(new Error("Tempo limite excedido. Tente novamente."));
    }, options.timeout ?? 120000);
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) abort();
    proc.stdout.on("data", (b: Buffer) => {
      output += b.toString();
      pending += b.toString();
      if (output.length > 5_000_000) {
        kill();
        finish(new Error("Resposta acima do limite."));
        return;
      }
      let i;
      while ((i = pending.indexOf("\n")) >= 0) {
        options.onLine?.(pending.slice(0, i));
        pending = pending.slice(i + 1);
      }
    });
    proc.stderr.on("data", (b: Buffer) => {
      stderr = (stderr + b.toString()).slice(-2000);
    });
    proc.on("error", () =>
      finish(
        new Error(
          `${command} não foi encontrado ou não pôde iniciar. Instale o runtime e execute doctor.`,
        ),
      ),
    );
    proc.on("close", (code) => {
      if (pending) options.onLine?.(pending);
      if (code === 0) finish();
      else
        finish(
          new Error(
            `${command} encerrou com erro (${code}). Verifique autenticação, versão e limite da conta.`,
          ),
        );
    });
    proc.stdin.on("error", () => {});
    proc.stdin.end(options.input ?? "");
  });
}
