# PatchProof

PatchProof is a GenLayer reference project for evidence-bound software-release remediation verdicts. For one registered policy, validators independently fetch public CISA KEV and GitHub evidence, compare an exact base and release artifact, and finalize a narrow `REMEDIATED`, `NOT_REMEDIATED`, or `UNVERIFIABLE` result. The canonical on-chain read fails closed when evidence is missing, malformed, challenged, stale, or expired.

This project is not a vulnerability scanner, security audit, legal determination, production assurance, or claim that a release is free of unrelated vulnerabilities.

## Live deployment

- Network: GenLayer Testnet Bradbury (chain `4221`)
- Contract: [`0xa803A6CE6eB741a9c864462c312e45177fb20E56`](https://explorer-bradbury.genlayer.com/address/0xa803A6CE6eB741a9c864462c312e45177fb20E56)
- Deployment transaction: [`0x2261b791e957902612194e62de6a4eee1bc7bcc4afc59dde5d50b22ed677f2cb`](https://explorer-bradbury.genlayer.com/tx/0x2261b791e957902612194e62de6a4eee1bc7bcc4afc59dde5d50b22ed677f2cb)
- Sanitized canonical evidence: [`evidence/deployment.json`](evidence/deployment.json)
- Sanitized browser-wallet evidence: [`evidence/browser-production.json`](evidence/browser-production.json)
- Copy-ready Portal fields: [`evidence/portal-submission.md`](evidence/portal-submission.md)

The web app exposes read-only inspection without a wallet and explicit EIP-6963 wallet selection for writes. It switches or adds Bradbury before sending a transaction, displays the submitted/accepted/finalized lifecycle, and reloads canonical state only after finality.

## What is implemented

One intelligent contract exposes seven public methods:

| Kind | Methods |
|---|---|
| Write | `register_policy`, `submit_claim`, `evaluate`, `challenge` |
| View | `get_release_status`, `get_revision`, `get_release_eligibility` |

Evidence is restricted to a fixed public allowlist:

- CISA Known Exploited Vulnerabilities catalog
- GitHub global advisory metadata
- An immutable repository compare
- An exact release tag
- Check runs for the claimed release commit

The deterministic layer binds policy identity, CVE/GHSA identifiers, component, commits, tag, expected check, policy version, and normalized evidence hash. Only the bounded excerpts are sent to comparative consensus. A challenge immediately removes eligibility while preserving revision history.

## Run locally

Requirements: Node.js 24, Python 3.13, Chrome, and the GenLayer CLI.

```bash
npm ci
python -m venv .venv
.venv/bin/python -m pip install -e .
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, activate or address `.venv\Scripts\python.exe` instead of `.venv/bin/python`.

Set only public frontend configuration in `.env.local`:

```text
NEXT_PUBLIC_GENLAYER_NETWORK=testnetBradbury
NEXT_PUBLIC_GENLAYER_RPC_URL=https://rpc-bradbury.genlayer.com
NEXT_PUBLIC_PATCHPROOF_CONTRACT=0xa803A6CE6eB741a9c864462c312e45177fb20E56
```

Never expose a deployer key through a `NEXT_PUBLIC_*` variable.

## Verify

```bash
npm run check
npm audit --audit-level=high
npm run preflight
```

The fresh verification baseline contains 60 automated tests:

- 17 direct and adversarial contract tests
- 33 TypeScript unit, component, adapter, and deployment-state tests
- 10 Chrome browser tests, including four responsive breakpoints

The aggregate check also runs contract lint/schema extraction, ESLint, TypeScript, and a production Next.js build. See [`docs/LOCAL-VERIFICATION.md`](docs/LOCAL-VERIFICATION.md) for the exact toolchain and verified boundary.

## Architecture and evidence model

- [`contracts/PatchProof.py`](contracts/PatchProof.py) owns policy identity, monotonic revisions, consensus evaluation, challenge state, expiry, and eligibility.
- [`frontend/`](frontend/) contains the wallet-aware Next.js interface and fail-closed OpenVEX-style export adapter.
- [`deploy/`](deploy/) contains public preflight plus a resumable deployment state machine that recovers a known transaction instead of replaying writes.
- [`docs/SPEC.md`](docs/SPEC.md) is the locked specification; [`docs/MATRICES.md`](docs/MATRICES.md) maps claims to code, evidence value, compatibility, and safety controls.
- [`evidence/`](evidence/) contains sanitized public proof only. Raw wallet material, private receipts, validator traces, and secrets are excluded.

## Honest limitations

- A verdict is scoped to the exact registered repository, component, vulnerability, commits, tag, policy version, evidence sources, and expiry window.
- GitHub rate limits, unavailable sources, unexpected schemas, or insufficient validator agreement yield `UNVERIFIABLE`; there is no cached-success fallback.
- The current stable contract runner `1jb…` is locked because it passes the documented lint, schema, and direct-test surfaces. Migration to the newer `9b8…` runner remains proof debt until the pinned validation toolchain can load it.
- Automated Chrome tests prove UI behavior and Bradbury browser CORS, but do not claim third-party adoption, repository-wide security, or Portal acceptance.
- PatchProof has no upgrade or privileged override path. A changed policy requires a new policy identifier.

## License

MIT. See [`LICENSE`](LICENSE).
