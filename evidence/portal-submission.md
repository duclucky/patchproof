# Copy-ready Portal fields

Preparation status: `SUBMISSION_READY`. These fields are ready to copy into the authenticated GenLayer Portal by a human operator. No final Portal Submit has been performed.

## Project

- Title: PatchProof
- Track: Projects
- Category: Evidence-bound release remediation
- Public repository: https://github.com/duclucky/patchproof
- Live app: https://patchproof-nine.vercel.app/
- Primary contract: https://explorer-bradbury.genlayer.com/address/0xa803A6CE6eB741a9c864462c312e45177fb20E56
- Deployment transaction: https://explorer-bradbury.genlayer.com/tx/0x2261b791e957902612194e62de6a4eee1bc7bcc4afc59dde5d50b22ed677f2cb
- Sanitized deployment evidence: `evidence/deployment.json`
- Sanitized browser-wallet evidence: `evidence/browser-production.json`
- Validator inspection: `evidence/validator-inspection.md`

## Short description

PatchProof is a GenLayer Projects-track reference app for evidence-bound software-release remediation verdicts. It lets a maintainer register an exact policy, submit a release claim, and ask validators to independently refetch allowlisted CISA KEV and GitHub evidence before any release becomes eligible. Missing, mismatched, malformed, challenged, expired, or unverifiable evidence fails closed.

## Exact implementation counts

- Intelligent contracts: 1
- Public contract methods: 7
- Write methods: 4 (`register_policy`, `submit_claim`, `evaluate`, `challenge`)
- View methods: 3 (`get_release_status`, `get_revision`, `get_release_eligibility`)
- Automated tests in the documented baseline: 60
- Browser breakpoints covered by e2e tests: 4

## Finalized execution and canonical consequence

Deployment transaction `0x2261b791e957902612194e62de6a4eee1bc7bcc4afc59dde5d50b22ed677f2cb` finalized on GenLayer Bradbury with `AGREE` consensus and `FINISHED_WITH_RETURN`. The deployed code hash matched the locked source hash, the schema exposed one contract with seven public methods, and an absent-policy canonical read failed closed.

After explicit user authorization in Chrome, the production app registered policy `demo-policy`, submitted revision `1`, and evaluated it. The final canonical read returned `eligible=false`, no pending revision, and revision `1` status `UNVERIFIABLE` with verdict reason `CVE_NOT_IN_KEV`. This is intentionally not a positive remediation proof.

## Reuse value

- Maintainers can bind a release claim to exact public evidence instead of relying on an unverified changelog statement.
- Downstream CI, dashboards, and OpenVEX-style consumers can read a canonical fail-closed status.
- Other GenLayer projects can reuse the pattern: deterministic identity binding, validator-side refetch, structured verdict validation, challenge/expiry gates, and canonical reads after finality.

## Honest limitations

- PatchProof is not a vulnerability scanner, security audit, legal determination, production assurance, or guarantee that a release is safe.
- The demo browser-wallet lifecycle produced `UNVERIFIABLE`, not `REMEDIATED`.
- The browser session exposed shortened write hashes for the wallet actions; this evidence does not claim full write receipts for those writes.
- GitHub rate limits, unavailable sources, unexpected schemas, or insufficient validator agreement yield `UNVERIFIABLE`; there is no cached-success fallback.
- No external adopter, production-security certification, Portal submission, Portal acceptance, or final reviewer outcome is claimed.

## Submission boundary

Final Portal Submit requires explicit action-time authorization in the authenticated Portal session. This repository does not automate or imply that action.
