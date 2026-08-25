# Security Console Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign PatchProof's first screen into a dense security operations console and deploy the verified result to Vercel for direct Chrome use.

**Architecture:** Keep the existing Next.js client page and wallet/contract APIs. Refactor only the page presentation and CSS around the existing state and write handlers. Deploy through the existing Vercel project after local verification.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Phosphor icons, TanStack Query, Playwright, Vitest, Vercel CLI.

## Global Constraints

- Preserve fail-closed eligibility and disabled writes until wallet plus valid contract are present.
- Use Phosphor icons only; no emoji icons.
- Use 8 px radius or less and no nested card shells.
- Verify 375, 768, 1024, and 1440 px viewports without horizontal overflow.
- Respect `prefers-reduced-motion`.
- Do not redeploy the contract or fabricate wallet, browser, receipt, finality, repository, adoption, or Portal evidence.
- Do not perform final Portal Submit.

---

### Task 1: E2E Tests For Security Console

**Files:**
- Modify: `tests/e2e/dashboard.spec.ts`

**Interfaces:**
- Consumes: Existing Playwright dashboard route `/`.
- Produces: Failing assertions for new console heading, workflow tabs, disabled action state, and tab switching.

- [ ] **Step 1: Write the failing test**

Replace the first viewport assertion with:

```ts
await expect(
  page.getByRole("heading", { name: "Security intelligence console" }),
).toBeVisible();
await expect(page.getByRole("tab", { name: "Inspect" })).toBeVisible();
await expect(page.getByRole("tab", { name: "Register" })).toBeVisible();
await expect(page.getByRole("tab", { name: "Submit" })).toBeVisible();
await expect(page.getByRole("tab", { name: "Evaluate" })).toBeVisible();
await expect(page.getByRole("tab", { name: "Challenge" })).toBeVisible();
await expect(page.getByText("Bradbury testnet")).toBeVisible();
await expect(page.getByText("No EIP-6963 wallet detected.")).toBeVisible();
```

Add a tab behavior test:

```ts
test("workflow tabs reveal one write surface while preserving wallet gate", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Submit" }).click();
  await expect(page.getByRole("tabpanel", { name: "Submit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit claim" })).toBeDisabled();
  await page.getByRole("tab", { name: "Challenge" }).click();
  await expect(page.getByRole("tabpanel", { name: "Challenge" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open challenge" })).toBeDisabled();
});
```

- [ ] **Step 2: Run focused e2e to verify RED**

Run: `npm run test:e2e -- tests/e2e/dashboard.spec.ts`

Expected: FAIL because the current page still uses the old heading and has no `tab` roles.

- [ ] **Step 3: Keep the failing test intact**

Do not weaken assertions. The implementation must satisfy this observable UI.

---

### Task 2: Implement Security Console UI

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/globals.css`

**Interfaces:**
- Consumes: Existing `StatusCard`, `RegistrationForm`, `useWallets`, gateway methods, and transaction state.
- Produces: A security console page with `CommandHeader`, `SignalGrid`, `WorkflowTabs`, wallet panel, action panels, and preserved write handlers.

- [ ] **Step 1: Implement page structure**

In `frontend/app/page.tsx`, add `Tab` state:

```ts
type WorkflowTab = "inspect" | "register" | "submit" | "evaluate" | "challenge";
const [activeTab, setActiveTab] = useState<WorkflowTab>("inspect");
```

Render `role="tablist"`, one `button role="tab"` per workflow, and one visible `section role="tabpanel"` with `aria-label` equal to the active tab label.

- [ ] **Step 2: Preserve all existing actions**

Keep these handlers unchanged in behavior:

```ts
submitClaim(event);
registerPolicy(input);
submitChallenge(event);
runWrite("evaluate", { functionName: "evaluate", args: [policyId] });
downloadVex();
```

The disabled expressions stay based on:

```ts
!writeReady || activeAction !== null
status.kind !== "known" || status.currentRevision === 0
```

- [ ] **Step 3: Implement CSS tokens and layout**

In `frontend/app/globals.css`, replace the old light marketing layout with:

```css
:root {
  --bg: #08111f;
  --bg-2: #0f1724;
  --surface: #111c2b;
  --surface-2: #172235;
  --paper: #f5f8fc;
  --ink: #ecf4ff;
  --ink-dark: #102033;
  --muted: #98a8bb;
  --line: #26364c;
  --blue: #0ea5e9;
  --blue-strong: #0369a1;
  --green: #16a34a;
  --amber: #d97706;
  --red: #dc2626;
  --radius: 8px;
}
```

Use responsive grids and `overflow-wrap: anywhere` for hashes and addresses.

- [ ] **Step 4: Run focused e2e to verify GREEN**

Run: `npm run test:e2e -- tests/e2e/dashboard.spec.ts`

Expected: PASS with no horizontal overflow assertions failing.

- [ ] **Step 5: Run focused static checks**

Run: `npm run lint`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

---

### Task 3: Vercel Production And Chrome Handoff

**Files:**
- Modify: `.gitignore`
- Create or modify: `vercel.json`
- Modify: `evidence/browser-production.json`

**Interfaces:**
- Consumes: Existing Vercel project `patchproof` and public GitHub repo.
- Produces: Verified Vercel production URL opened in the user's Chrome tab, with user handoff but no transaction submission by Codex.

- [ ] **Step 1: Verify full local gate**

Run: `npm run check`

Expected: contract tests, GenVM lint, ESLint, TypeScript, Vitest, Next build, and Playwright all exit 0.

- [ ] **Step 2: Verify Vercel config**

Ensure `vercel.json` contains:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/.next"
}
```

Ensure `.vercel/` remains ignored.

- [ ] **Step 3: Deploy production**

Run a production deploy with the public contract env:

```bash
vercel --prod --yes --env NEXT_PUBLIC_PATCHPROOF_CONTRACT=0xa803A6CE6eB741a9c864462c312e45177fb20E56 --build-env NEXT_PUBLIC_PATCHPROOF_CONTRACT=0xa803A6CE6eB741a9c864462c312e45177fb20E56
```

Expected: CLI returns a production `https://...vercel.app` URL and no build error.

- [ ] **Step 4: Inspect production**

Open the returned URL and verify:

```text
Security intelligence console
Bradbury testnet
0xa803A6CE6eB741a9c864462c312e45177fb20E56
No EIP-6963 wallet detected.
```

If Chrome has a wallet extension, do not click connect or submit. Hand off the tab for the user to operate.

- [ ] **Step 5: Update evidence and push**

Update `evidence/browser-production.json` with sanitized URL, capture time, browser/wallet provider status, and the handoff state. Commit the redesign, Vercel config, and evidence. Push `main`.

- [ ] **Step 6: Final gate**

Run `git status --short` and confirm only allowed generated/ignored files remain. Re-run registry audit from the Forge root if Forge evidence state is advanced.

