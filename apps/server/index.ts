import { buildApp } from "./app.js";
const { app } = await buildApp();
try {
  await app.listen({
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? 4700),
  });
  console.log(
    "Jarvis v7 · http://127.0.0.1:" + String(process.env.PORT ?? 4700),
  );
} catch (error) {
  console.error(
    "Não foi possível iniciar. Verifique a porta e a pasta de dados.",
  );
  process.exitCode = 1;
  await app.close();
}
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
