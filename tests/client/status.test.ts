import { describe, expect, it } from "vitest";

import { parseReleaseStatus, parseRevision } from "@/lib/status";

describe("parseReleaseStatus", () => {
  it("keeps an absent policy in a fail-closed canonical state", () => {
    expect(
      parseReleaseStatus({
        exists: false,
        eligible: false,
        current_revision: 0,
        pending_revision: 0,
        pending_status: "",
      }),
    ).toMatchObject({ kind: "absent", eligible: false });
  });

  it("accepts a fully bound remediated policy", () => {
    const parsed = parseReleaseStatus({
      exists: true,
      eligible: true,
      owner: "0x1111111111111111111111111111111111111111",
      repository: "acme/widget",
      cve_id: "CVE-2025-12345",
      github_advisory_id: "GHSA-abcd-efgh-ijkl",
      component: "widget-core",
      base_commit: "a".repeat(40),
      policy_version: "v1",
      ttl_seconds: 86400,
      expected_check_name: "release",
      expected_check_app: "github-actions",
      current_revision: 2,
      pending_revision: 0,
      last_revision: 2,
      pending_status: "",
    });
    expect(parsed).toMatchObject({
      kind: "known",
      eligible: true,
      repository: "acme/widget",
      currentRevision: 2,
    });
  });

  it.each([null, "json", { exists: true }, { exists: true, eligible: "yes" }])(
    "rejects malformed or ambiguous chain output %#",
    (value) => expect(() => parseReleaseStatus(value)).toThrow("INVALID_RELEASE_STATUS"),
  );
});

describe("parseRevision", () => {
  it("accepts a complete terminal revision", () => {
    expect(
      parseRevision({
        exists: true,
        revision: 2,
        submitter: `0x${"1".repeat(40)}`,
        release_commit: "b".repeat(40),
        release_tag: "v2.1.0",
        evidence_note: "Release note",
        status: "REMEDIATED",
        verdict_reason: "Bounded evidence supports remediation.",
        evidence_hash: `sha256:${"c".repeat(64)}`,
        evaluated_at: 1_700_000_000,
        expires_at: 1_700_086_400,
        challenged: false,
        challenge_reason: "",
        challenge_of: 0,
      }),
    ).toMatchObject({ status: "REMEDIATED", revision: 2, challenged: false });
  });

  it("rejects an unknown verdict", () => {
    expect(() => parseRevision({ exists: true, status: "SAFE" })).toThrow(
      "INVALID_REVISION",
    );
  });
});
