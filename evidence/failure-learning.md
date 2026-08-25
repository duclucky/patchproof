# Deployment failure learning

## Finality recovery

The deployment CLI initially returned an `ACCEPTED` transaction. PatchProof stored the exact transaction fingerprint as `SUBMITTED` and timed out while waiting for `FINALIZED`; it did not replay the deployment.

The network-reported ready timestamp was used to bound recovery. Two public `finalize` calls emitted separate underlying EVM transactions that reverted, including one attempted just after the local UTC projection of the ready timestamp. Neither changed the deployment binding or created another contract. A subsequent canonical GenLayer read reported the original deployment transaction as `FINALIZED`, after which the resumable verifier recovered that transaction, matched deployed code to source, hashed the live schema, and completed the absent-policy canonical read.

Safe operational lesson: wall-clock projection and a finalize CLI return are not finality proof. Recovery must poll the original GenLayer transaction, then independently check finalized status, execution result, deployed identity, schema, and canonical state. Failed finalize-call hashes and raw output are excluded because they do not support the successful deployment claim.

## Toolchain drift

The current linter advertises runner `9b8…`, but the pinned linter and direct-test schema internals still import the legacy `genlayer.py` SDK layout and cannot load that runner. PatchProof remains on documented runner `1jb…`, which passes lint, schema extraction, direct execution, and Bradbury parsing. Migration stays explicit proof debt.

## Browser surface

The in-app browser blocked local loopback URLs with `ERR_BLOCKED_BY_CLIENT`. Repository-controlled Playwright tests used system Chrome for local responsive, reduced-motion, wallet-gate, and browser-origin Bradbury CORS verification. This is local browser evidence, not a real production wallet transaction.
