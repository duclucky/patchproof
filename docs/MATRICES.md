# Locked build matrices

## Claim-to-code map

| Public claim | Code surface | Test/evidence |
|---|---|---|
| Eligibility changes only after a finalized structured verdict | `contracts/PatchProof.py` state machine | direct state, revision, challenge, expiry, and replay tests |
| Authorities and artifact identity are independently re-fetched and exact-bound | contract evidence fetcher and validator | mocked authority/entity/parser/hash/source-failure tests plus Bradbury preflight |
| Vendor narrative cannot independently grant eligibility | deterministic binding around comparative consensus | party-only and malicious-instruction cases |
| CI and OpenVEX-style consumers can read a bounded result | `frontend/lib/gateway.ts`, `frontend/lib/status.ts`, `frontend/lib/openvex.ts` | adapter schema and fail-closed frontend tests |
| Deployment is resumable and finalized work is not replayed | `deploy/deploy.mjs`, `deploy/state.mjs` | parser/idempotency tests and sanitized receipt inspection |

## Evidence/value matrix

| Evidence | Supports | Does not support |
|---|---|---|
| CISA KEV record | Known exploitation, vendor/product, required action, dates | Patch sufficiency |
| GitHub advisory | Identifiers, package/component scope, affected and patched ranges | Completeness of a particular diff |
| Immutable compare, release, and expected check | Exact artifact, changed files, release statement, deterministic check outcome | Semantic remediation alone |
| Maintainer note | Claimed mapping for validator inspection | Any consequence alone |
| Final validator verdict | Bounded status for the exact registered case | Exhaustive security or absence of other vulnerabilities |

## Compatibility lock

| Surface | Locked value | Source/check |
|---|---|---|
| GenVM Depends | `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` | current public contract docs and the last runner fully supported by the locked lint/test toolchain, verified 2026-08-25 |
| Python | `>=3.12` (verified host `3.13.14`) | current official tooling docs and local runtime |
| GenLayer CLI | `0.39.2` | `genlayer --version` on 2026-08-25 |
| genlayer-test | `0.29.2` | PyPI index on 2026-08-25 |
| genvm-linter | `0.11.0` | PyPI index on 2026-08-25 |
| genlayer-js | `1.1.8` | npm registry on 2026-08-25 |
| Next.js | `16.3.2` | npm registry on 2026-08-25 |
| React | `19.2.8` | npm registry on 2026-08-25 |
| TanStack Query | `5.102.3` | npm registry on 2026-08-25 |
| Bradbury GenLayer RPC | `https://rpc-bradbury.genlayer.com` | current official network docs |
| Bradbury chain | `4221`, currency `GEN` | current official network docs |

The official boilerplate currently documents Next.js 15. PatchProof locks the current Next.js 16 release and must prove compatibility by typecheck, unit tests, production build, and browser smoke tests; a failure requires pinning to a verified supported version rather than suppressing it.

The linter advertises runner `9b8…`, also used by current Studio examples, but its schema loader and `genlayer-test 0.29.2` still import the legacy `genlayer.py` package and fail against that runner. Migration to `9b8…` remains explicit proof debt until the locked validation toolchain can lint, extract schema, and execute direct tests against it.

## Safety cards

| Hazard | Detection | Safe result | Recovery |
|---|---|---|---|
| Source unavailable/rate-limited/stale/malformed/wrong entity | host, status, entity, schema, exact fields | `UNVERIFIABLE`; no new eligibility | successor evaluation after recovery |
| Prompt injection in fetched text | quote as evidence; strict output schema and deterministic bindings | reject instruction effects; never positive by default | regression test then retry |
| Fabricated/omitted leader evidence | validator independently re-fetches and compares critical fields/hash | reject proposal | corrected evidence/implementation |
| Duplicate/stale/cross-case payload | sender, policy, chain, contract, monotonic revision, identity checks | revert before nondeterministic work | next valid revision |
| Challenge/expiry race | eligibility derives from current canonical state and transaction time | fail closed | finalized successor/new policy claim |
| Adapter parse/read failure | strict enum/schema; no cached-success fallback | `UNKNOWN`/`ERROR`; block eligibility | canonical reload and schema/code comparison |
| Secret/private content leakage | fixed public allowlist and repository scan | reject and exclude from state/logs | public hash-bound evidence only |
