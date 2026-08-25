# Sanitized validator inspection

Captured on 2026-08-25 from the canonical Bradbury transaction and contract reads. This file contains only public allowlisted fields; raw receipts, traces, messages, validator addresses/configuration, and command output are intentionally excluded.

## Deployment execution

| Field | Canonical value |
|---|---|
| Deployment transaction | `0x2261b791e957902612194e62de6a4eee1bc7bcc4afc59dde5d50b22ed677f2cb` |
| Status | `FINALIZED` (7) |
| Consensus result | `AGREE` |
| Execution result | `FINISHED_WITH_RETURN` |
| Initial validators | 3 |
| Consensus rounds | 0 |
| Contract | `0xa803A6CE6eB741a9c864462c312e45177fb20E56` |

The validator result establishes agreement on the deployment execution only. It is not a PatchProof release-remediation verdict and does not establish that any software release is secure or eligible.

## Identity and canonical consequence

- Local source hash and deployed-code hash are the same: `sha256:1dbd5c9ec3c0533ddbcb175b49dc62c6ac6233a7e0d0c1ca441bfb9649ccae8e`.
- The independently fetched deployed schema has one contract and seven public methods: three views and four writes.
- `get_release_status("deployment-smoke-absent")` returned `exists=false`, `eligible=false`, zero revisions, and no pending status after finality.

The deployment proof's initial finalized consequence is narrow and fail closed: an unknown policy has no eligibility.

## Production browser-wallet lifecycle

After user authorization in their Chrome wallet, the production app registered policy `demo-policy`, submitted revision `1`, and evaluated the pending claim. The final canonical contract read returned:

| Field | Canonical value |
|---|---|
| Policy | `demo-policy` |
| Repository | `example/openssl-wrapper` |
| CVE | `CVE-2024-0001` |
| Release tag | `v1.2.3` |
| Last revision | `1` |
| Current revision | `0` |
| Pending revision | `0` |
| Eligible | `false` |
| Revision 1 status | `UNVERIFIABLE` |
| Verdict reason | `CVE_NOT_IN_KEV` |

This is a semantic result, not a positive remediation proof. The canonical consequence is fail-closed: the demo release claim is not eligible because the claimed CVE was not present in the validator-fetched KEV source. Full write receipts for the browser-wallet actions are not claimed here because the production UI exposed only shortened write hashes during the live session.
