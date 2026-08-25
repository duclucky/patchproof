# Official source lock

Frozen: 2026-08-25 (UTC evidence timestamps are retained in the Forge run record).

- GenLayer “When to use”: a fit requires subjective judgment, shared state, trust minimization, and consensus; ordinary deterministic validation alone is not enough.
- Equivalence Principle: classification and settlement-like decisions should use comparative validation unless validators can independently verify from source evidence; custom validators are recommended for precise control.
- Contract structure: exactly one contract per file, public decorators, annotated persistent fields, and the pinned Depends runner above.
- Non-determinism/web access: all web/LLM calls stay inside the equivalence boundary; independently fetch stable fields and handle source errors.
- Testing/tooling: Python 3.12+, `genvm-lint`, direct tests, Studio/integration tests, then Bradbury for real validators.
- Networks: Bradbury GenLayer RPC `https://rpc-bradbury.genlayer.com`, chain id `4221`; browser wallets connect to the GenLayer RPC.
- GenLayerJS: separate read/write clients, `testnetBradbury`, `TransactionStatus`, wallet-backed provider, fee estimation, and canonical receipt waits.

Material drift found during build preflight: the first-contract docs still prescribe the `1jb…` runner while `genvm-linter 0.11.0` and current official GenLayer Studio v0.3.0 examples advertise `9b8…`. The advertised runner cannot currently be validated by the locked tools: the linter schema loader and `genlayer-test 0.29.2` import `genlayer.py`, which does not exist in `9b8…`. PatchProof therefore pins the documented `1jb…` runner that passes lint, schema extraction, and direct execution, and records migration to `9b8…` as proof debt rather than claiming unverified compatibility. The network-configuration page also contains older shared-endpoint wording, while the newer authoritative Networks page and current SDK export name the dedicated Bradbury RPC; PatchProof uses the newer Networks page and verifies the endpoint directly.

Primary links:

- https://docs.genlayer.com/developers/intelligent-contracts/when-to-use
- https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle
- https://docs.genlayer.com/developers/intelligent-contracts/first-contract
- https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism
- https://docs.genlayer.com/developers/intelligent-contracts/features/web-access
- https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context
- https://docs.genlayer.com/developers/intelligent-contracts/testing
- https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup
- https://docs.genlayer.com/developers/networks
- https://docs.genlayer.com/api-references/genlayer-js
- https://github.com/genlayerlabs/genlayer-project-boilerplate
