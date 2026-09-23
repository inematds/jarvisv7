import { test, expect } from "@playwright/test";
test("instalação, memória, histórico e troca de cérebro", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Explorar primeiro, conectar depois" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByLabel("Mensagem para o Jarvis")
    .fill("Lembre que o marco do projeto é novembro.");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(page.locator(".message.assistant").first()).toContainText(
    "Memória salva",
  );
  await page.getByRole("button", { name: "Memórias", exact: true }).click();
  await expect(page.locator("main")).toContainText("marco do projeto");
  await page.getByRole("button", { name: "Conversa", exact: true }).click();
  await page.getByRole("button", { name: "Histórico", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button")
    .filter({ hasText: "marco do projeto" })
    .click();
  await expect(page.locator(".messages")).toContainText("Memória salva");
  await page.locator(".composer-model").click();
  await page.getByLabel("Modelo da conversa").selectOption("local-search");
  await page.getByRole("button", { name: "Usar nesta conversa" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByLabel("Mensagem para o Jarvis")
    .fill("Qual é o marco do projeto?");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(page.locator(".messages")).toContainText(
    "sem interpretação por IA",
  );
  expect(errors).toEqual([]);
});
test("menu e histórico disponíveis no celular sem overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Histórico", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await expect(page.getByText("Do seu jeito.")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Dados e versões" }).click();
  await expect(page.getByRole("link", { name: "Exportar JSON" })).toBeVisible();
});
test("JEV pode ser ativado e fallback fica visível sem credencial", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.getByRole("button", { name: "Preferências", exact: true }).click();
  const toggle = page.getByRole("switch", { name: /JEV/ });
  await toggle.check();
  await page.getByRole("button", { name: /Salvar/ }).click();
  await page.getByRole("button", { name: "Conversa", exact: true }).click();
  await page
    .getByLabel("Mensagem para o Jarvis")
    .fill("Quais são minhas notas do projeto?");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(
    page.locator("summary").filter({ hasText: "JEV indisponível" }),
  ).toBeVisible();
  await page.locator("summary").filter({ hasText: "JEV indisponível" }).click();
  await expect(
    page.getByText("Confira a conexão OpenRouter.", { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/jarvis-jev-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/jarvis-jev-mobile.png" });
});
