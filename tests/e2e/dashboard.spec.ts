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
        name: "Release protection status",
      }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Inspect" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Register" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Submit" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Evaluate" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Challenge" })).toBeVisible();
    await expect(page.getByLabel("Operational summary").getByText("Needs review")).toBeVisible();
    await expect(page.getByText("Chain ID")).toBeHidden();
    await expect(page.getByText("4221")).toBeHidden();
    await expect(page.getByText("0xa803A6CE6eB741a9c864462c312e45177fb20E56")).toBeHidden();
    await page.getByText("Technical details").click();
    await expect(page.getByText("Chain ID")).toBeVisible();
    await expect(page.getByText("4221")).toBeVisible();
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

test("wallet choices open in a dialog only after connect intent", async ({ page }) => {
  await page.addInitScript(() => {
    const icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
    const provider = {
      request: async ({ method }: { method: string }) => {
        if (method === "eth_chainId") return "0x107d";
        if (method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
        return null;
      },
    };
    window.addEventListener("eip6963:requestProvider", () => {
      window.dispatchEvent(new CustomEvent("eip6963:announceProvider", {
        detail: { info: { uuid: "rabbit", name: "Rabbit Wallet", icon, rdns: "io.rabby" }, provider },
      }));
      window.dispatchEvent(new CustomEvent("eip6963:announceProvider", {
        detail: { info: { uuid: "okx", name: "OKX Wallet", icon, rdns: "com.okx" }, provider },
      }));
    });
  });

  await page.goto("/");
  await expect(page.getByLabel("Authorization").getByText("Rabbit Wallet")).toBeHidden();
  await expect(page.getByLabel("Authorization").getByText("OKX Wallet")).toBeHidden();

  await page.getByRole("button", { name: "Connect wallet" }).click();
  const dialog = page.getByRole("dialog", { name: "Connect wallet" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Rabbit Wallet" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "OKX Wallet" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("invalid address remains fail-closed and cannot reload", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Technical details").click();
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
