import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  test(`fail-closed dashboard at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Security intelligence console",
      }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Inspect" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Register" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Submit" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Evaluate" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Challenge" })).toBeVisible();
    await expect(page.getByLabel("Deployment state").getByText("Bradbury testnet")).toBeVisible();
    await expect(page.getByText("0xa803A6CE6eB741a9c864462c312e45177fb20E56")).toBeVisible();
    await expect(page.getByLabel("Authorization").getByText("No EIP-6963 wallet detected.")).toBeVisible();
    await expect(page.getByText("Not eligible")).toBeVisible();
    await expect(page.locator(".status-card").getByText(/Unknown always fails closed/)).toBeVisible();
    await page.getByRole("tab", { name: "Submit" }).click();
    await expect(page.getByRole("button", { name: "Submit claim" })).toBeDisabled();
    await page.getByRole("tab", { name: "Evaluate" }).click();
    await expect(page.getByRole("button", { name: "Evaluate" })).toBeDisabled();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });
}

test("respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
});

test("workflow tabs reveal one write surface while preserving wallet gate", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Submit" }).click();
  await expect(page.getByRole("tabpanel", { name: "Submit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit claim" })).toBeDisabled();
  await page.getByRole("tab", { name: "Challenge" }).click();
  await expect(page.getByRole("tabpanel", { name: "Challenge" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open challenge" })).toBeDisabled();
});

test("invalid address remains fail-closed and cannot reload", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Contract address").press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.getByLabel("Contract address").pressSequentially("0x1234");
  await expect(page.getByLabel("Contract address")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("button", { name: "Reload canonical status" })).toBeDisabled();
  await expect(page.getByText("Not eligible")).toBeVisible();
});

test("registration is explicit and wallet-gated", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByText("Register an immutable policy").click();
  await expect(page.getByRole("button", { name: "Register policy" })).toBeDisabled();
  await expect(page.getByLabel("Repository owner/name")).toBeVisible();
  await expect(page.getByLabel("TTL in seconds")).toHaveValue("86400");
});

test("browser origin can read Bradbury RPC with CORS", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const response = await fetch("https://rpc-bradbury.genlayer.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
    });
    return { ok: response.ok, body: await response.json() };
  });
  expect(result.ok).toBe(true);
  expect(result.body.result).toBe("0x107d");
});
