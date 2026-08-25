# PatchProof Security Console Redesign

## Goal

Replace the sparse first screen with a dense, trustworthy security operations console that lets a user inspect PatchProof's Bradbury deployment, wallet readiness, canonical release status, and release workflow without losing the existing fail-closed behavior.

## Approved Direction

Use the approved "Security Intelligence Console" direction:

- A rich dark header band with immediate product identity, Bradbury network, contract address, wallet state, and source links.
- A data-dense dashboard body with compact evidence, eligibility, revision, and lifecycle signals.
- A tabbed workflow for Inspect, Register, Submit, Evaluate, and Challenge so the user sees one action surface at a time.
- Security blue and protected green as functional accents, with amber and red reserved for pending and failure states.
- Phosphor icons only. No emoji icons.
- Restrained motion, strong focus states, and responsive layouts verified at 375, 768, 1024, and 1440 px.

## UX Requirements

The first viewport must behave like an application, not a marketing page. It should show the current operational state before explanation copy:

- Chain: Bradbury testnet, chain id 4221.
- Contract: configured `NEXT_PUBLIC_PATCHPROOF_CONTRACT` when available, with explorer link.
- Wallet: connected account, detected wallet list, or explicit "No EIP-6963 wallet detected."
- Canonical state: eligible or ineligible status, current revision, pending revision, repository, vulnerability, component, and policy metadata.
- Write readiness: disabled until a valid contract address and Bradbury wallet are present.

The workflow must preserve existing write behavior:

- Register policy remains explicit and wallet-gated.
- Submit claim keeps exact commit, release tag, and evidence note inputs.
- Evaluate remains a single policy write.
- Challenge requires a reason and remains visually separated as a dangerous action.
- Export OpenVEX remains disabled unless a known nonzero revision is loaded.

## Visual System

The visual system follows the verified ui-ux-pro-max guidance already selected for this app: data-dense dashboard structure, security blue/protected green semantics, technical typography, 4/8 px spacing rhythm, accessible focus, and responsive no-overflow layout.

Concrete constraints:

- Dark shell: use deep neutral surfaces for the app frame, but do not make the whole page a one-hue blue/slate block.
- Surface hierarchy: use compact panels with 8 px radius or less, clear dividers, and measured elevation. Do not nest cards inside cards.
- Typography: keep body text at 16 px or larger on mobile, use tabular figures for hashes/counts, and allow long hashes/URLs to wrap.
- Color: state meaning must include labels or icons, not color alone.
- Motion: use hover/press/focus transitions only; respect `prefers-reduced-motion`.
- Touch: all interactive controls must be at least 44 px high.

## Component Structure

Keep the current Next.js client-page architecture, but split presentation into smaller local components inside `frontend/app/page.tsx` only if it reduces the monolithic render. Do not change contract APIs, wallet discovery, status parsing, or transaction state semantics unless tests require it.

Expected UI sections:

- `CommandHeader`: brand, network, contract short address, wallet summary, source/explorer actions.
- `HeroConsole`: product title plus operational summary chips, not a marketing-only hero.
- `SignalGrid`: eligibility, revision, policy, and evidence/value cells.
- `WorkflowTabs`: five tabs for Inspect, Register, Submit, Evaluate, Challenge.
- `InspectPanel`: address/policy inputs, reload, status card, OpenVEX export.
- `WalletPanel`: detected wallet/connect/disconnect plus transaction state.
- `ActionPanels`: existing register, submit, evaluate, and challenge forms.
- `BoundaryBand`: honest scope and limitations retained near the bottom.

## Testing And Verification

Use TDD before implementation changes:

- Update Playwright coverage so the new first viewport must expose "Security intelligence console", workflow tabs, fail-closed status, and disabled write buttons at 375, 768, 1024, and 1440 px.
- Verify tab interaction changes the visible action surface without enabling writes.
- Preserve invalid address fail-closed behavior.
- Preserve explicit registration wallet gate.
- Preserve Bradbury RPC CORS e2e check.

Final checks:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- Vercel production deploy with `NEXT_PUBLIC_PATCHPROOF_CONTRACT=0xa803A6CE6eB741a9c864462c312e45177fb20E56`
- Chrome inspection of the production URL before handoff to the user.

## Out Of Scope

- No contract redeploy.
- No fabricated wallet, browser, receipt, finality, repository, adoption, or Portal evidence.
- No final Portal Submit.
- No broad refactor of contract, deployment scripts, or Forge registry state.
- No new design-system package or component library.

