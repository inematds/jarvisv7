import { spawnSync } from "node:child_process";
for (const args of [["run", "doctor"], ["test"], ["run", "build"]]) {
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    stdio: "inherit",
  });
  if (r.status !== 0) {
    process.exitCode = r.status ?? 1;
    break;
  }
}
