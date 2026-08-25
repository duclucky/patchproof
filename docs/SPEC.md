# PatchProof specification lock

Status: `SPEC_LOCKED`
Track: `PROJECTS`
Immutable Forge binding: `patchproof`
Locked at: `2026-08-25T11:32:00Z`

## Public claim boundary

PatchProof is a reference implementation for evidence-bound public software-release remediation verdicts. It is not a security audit, vulnerability scanner, legal determination, production assurance, adoption proof, or guarantee that a release is safe.

## Product objective

For one registered policy, independently re-fetch public CISA and GitHub evidence and decide whether a named release materially remediates one known-exploited vulnerability for one component. A finalized verdict controls a canonical on-chain eligibility read.

## Roles and authority

- Policy owner: registers immutable policy identity and submits successor release evidence.
- Challenger: any address may challenge the current finalized revision once; the current eligibility then fails closed until a successor verdict finalizes.
- Validators: independently fetch the allowlisted evidence and reach semantic consensus.
- Consumer: reads canonical eligibility or exports the bounded OpenVEX-style adapter document.
- Contract: owns revision monotonicity, terminal states, challenge binding, expiry, and the eligibility gate.

Party narrative is evidence for inspection only. It cannot grant eligibility by itself.

## State model

Policy states are derived from two monotonic counters: `current_revision` and `pending_revision`.

Revision states:

`CLAIMED -> EVALUATING -> REMEDIATED | NOT_REMEDIATED | UNVERIFIABLE`

A challenge freezes the prior terminal revision as `CHALLENGED` and creates a new `CLAIMED` revision bound to the same evidence. Terminal history is never overwritten.

Rules:

1. Only the policy owner can submit a new release claim.
2. At most one pending revision exists per policy.
3. Revisions only increase by one.
4. `REMEDIATED` and `NOT_REMEDIATED` become the current finalized revision.
5. `UNVERIFIABLE` never replaces a prior finalized revision.
6. Eligibility is true only when the current revision is finalized `REMEDIATED`, unchallenged, and unexpired.
7. A challenge or expiry makes eligibility false without rewriting history.
8. A failed or malformed evidence fetch produces `UNVERIFIABLE`, never a positive verdict.

## Bounded public interface

- `register_policy(policy_id, repository, cve_id, github_advisory_id, component, base_commit, policy_version, ttl_seconds, expected_check_name, expected_check_app)`
- `submit_claim(policy_id, release_commit, release_tag, evidence_note)`
- `evaluate(policy_id)`
- `challenge(policy_id, reason)`
- `get_release_status(policy_id)`
- `get_revision(policy_id, revision)`
- `get_release_eligibility(policy_id)`

## Evidence binding

Only these HTTPS hosts and derived endpoints are permitted:

- `www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
- `api.github.com/advisories/{GHSA}`
- `api.github.com/repos/{owner}/{repo}/compare/{base}...{release}`
- `api.github.com/repos/{owner}/{repo}/releases/tags/{tag}`
- `api.github.com/repos/{owner}/{repo}/commits/{release}/check-runs`

The deterministic layer validates repository, CVE, GHSA, component, commit, tag, policy version, enum values, and a SHA-256 hash of the normalized evidence bundle. The LLM receives bounded JSON excerpts, not raw authority to follow fetched instructions.

The evidence bundle includes stable fields only and caps file count, patch length, release-note length, and advisory text length. GitHub rate limits, source errors, entity mismatches, missing expected checks, malformed model output, or inconsistent critical fields yield `UNVERIFIABLE`.

## Verdict semantics

- `REMEDIATED`: authoritative metadata and the patch/release/check evidence materially support the specified remediation under the registered policy.
- `NOT_REMEDIATED`: evidence is available and materially contradicts or fails the registered remediation requirement.
- `UNVERIFIABLE`: authority, availability, parsing, identity binding, or consensus is insufficient. This is non-penalizing and cannot replace a prior finalized revision.

The verdict is narrow to the exact repository, component, vulnerability, commit, tag, policy version, and evidence hash. It says nothing about unrelated vulnerabilities.

## UI lifecycle

The production web app provides:

- EIP-6963 wallet discovery with an explicit wallet picker and a selectable legacy fallback; it never auto-selects the first provider.
- Separate read and wallet-backed write clients on Bradbury.
- Explicit network add/switch before writes.
- Canonical reload after each finalized transaction.
- Visible `submitted`, `accepted`, `finalized`, `failed`, and retry states.
- Account menu and disconnect that clear address, provider, transaction, and cached case state.
- Read-only inspection and OpenVEX-style export without a wallet.

## Non-goals

- Private advisories, credentialed APIs, source uploads, package scanning, arbitrary URLs, automatic patch generation, escrow, legal compliance, and production certification.
- Claiming external adoption or final Portal submission.
