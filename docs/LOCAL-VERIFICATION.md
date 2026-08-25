# Local verification evidence

Verified on 2026-08-25 with Python 3.13.14, Node.js 24.11.1, npm 11.18.0, Chrome 151, GenLayer CLI 0.39.2, `genlayer-test` 0.29.2, and `genvm-linter` 0.11.0.

## Fresh results

| Surface | Command/check | Result |
|---|---|---|
| Contract lint and schema | `npm run contract:lint` | passed; one `PatchProof` contract, 7 public methods (3 view, 4 write) |
| Contract direct/adversarial behavior | `npm run contract:test` | 17 passed |
| TypeScript units/components/deploy-state | `npm test` | 33 passed in 8 files |
| Frontend types | `npm run typecheck` | passed |
| Frontend lint | `npm run lint` | passed with zero warnings |
| Production build | `npm run build` | passed; `/` statically prerendered |
| Browser smoke | `npm run test:e2e` | 8 passed in Chrome 151 |
| Dependency audit | `npm audit --audit-level=high` | 0 vulnerabilities after bounded dev-dependency upgrades |
| Bradbury public preflight | `npm run preflight` | chain 4221, 7-method schema, 4 write ABI round-trips, current gas price read |

Browser smoke covers 375, 768, 1024, and 1440 px widths; no horizontal overflow; unknown/invalid states fail closed; writes stay wallet-gated; registration is explicit; reduced-motion is honored; and a browser origin can call the Bradbury RPC under CORS.

The UI direction came from the verified UI/UX database result for trustworthy, dense software-security evidence: Swiss-style hierarchy, high contrast, restrained blue/green status color, strong focus states, 44 px controls, responsive collapse, and no decorative motion. The in-app browser surface blocked local loopback URLs with `ERR_BLOCKED_BY_CLIENT`, so visual QA and browser assertions used the repository's Chrome Playwright suite instead.

## Compatibility boundary

The public GenLayer contract docs still prescribe runner `1jb…`, which passes lint, schema extraction, direct execution, and Bradbury schema parsing. Runner `9b8…` is advertised by newer Studio examples but cannot be loaded by the pinned linter/test schema internals; migration remains explicit proof debt. This evidence does not claim production safety, repository-wide security, external adoption, or Portal acceptance.
