# Implementation plan

Each behavior step follows RED → GREEN → REFACTOR and records fresh verification.

1. Contract state and authorization
   - Write failing direct tests for registration, owner-only submissions, monotonic revisions, duplicate/pending rejection, and views.
   - Implement the minimum deterministic storage model.
2. Consensus and evidence safety
   - Write failing tests for positive, negative, unavailable, wrong-entity, malformed, prompt-injection, and malicious-output cases.
   - Implement bounded allowlisted fetches, normalized evidence hashing, comparative consensus, structured validation, and non-penalizing `UNVERIFIABLE`.
3. Consequence lifecycle
   - Write failing tests for current/pending separation, challenge, terminal history, retry, expiry, and eligibility.
   - Implement challenge-bound successor revisions and transaction-time expiry.
4. Client and adapter
   - Write failing TypeScript tests for ABI parsing, canonical read states, OpenVEX-style export, unknown/error fail-closed behavior, transaction state reduction, and deployment-state parsing.
   - Implement typed clients and adapters.
5. Wallet and UI
   - Write failing component/hook tests for EIP-6963 discovery, explicit choice, legacy fallback, disconnect cleanup, network switch, state feedback, retry, and canonical reload.
   - Implement the responsive Swiss-style operator UI using the verified PatchProof design system.
6. Verification and deployment
   - Run contract lint, direct/adversarial tests, frontend tests, accessibility checks, typecheck, production build, and local browser smoke at 375/768/1024/1440 with reduced motion.
   - Run Bradbury RPC/CORS/LLM capability, account-presence, balance, fee, ABI roundtrip, and browser-wallet preflight.
   - Deploy through resumable state, wait for finality, inspect code/schema/receipt/semantic result/canonical consequence separately, and save only sanitized evidence.
7. Public handoff
   - Scan repository history and working tree for secrets/control artifacts, verify exact counts/links/limitations, prepare copy-ready Portal fields, and stop before final Portal Submit.
