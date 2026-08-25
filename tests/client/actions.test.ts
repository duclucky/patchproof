import { describe, expect, it } from "vitest";

import { buildRegistrationRequest } from "@/lib/actions";

describe("buildRegistrationRequest", () => {
  it("keeps the ten policy bindings in contract ABI order", () => {
    expect(
      buildRegistrationRequest({
        policyId: "widget-cve",
        repository: "acme/widget",
        cveId: "CVE-2025-12345",
        githubAdvisoryId: "GHSA-abcd-efgh-ijkl",
        component: "widget-core",
        baseCommit: "a".repeat(40),
        policyVersion: "v1",
        ttlSeconds: 86400,
        expectedCheckName: "release",
        expectedCheckApp: "github-actions",
      }),
    ).toEqual({
      functionName: "register_policy",
      args: [
        "widget-cve",
        "acme/widget",
        "CVE-2025-12345",
        "GHSA-abcd-efgh-ijkl",
        "widget-core",
        "a".repeat(40),
        "v1",
        86400,
        "release",
        "github-actions",
      ],
    });
  });

  it("rejects non-integer TTL values before wallet submission", () => {
    expect(() =>
      buildRegistrationRequest({
        policyId: "widget-cve",
        repository: "acme/widget",
        cveId: "CVE-2025-12345",
        githubAdvisoryId: "GHSA-abcd-efgh-ijkl",
        component: "widget-core",
        baseCommit: "a".repeat(40),
        policyVersion: "v1",
        ttlSeconds: 1.5,
        expectedCheckName: "release",
        expectedCheckApp: "github-actions",
      }),
    ).toThrow("INVALID_REGISTRATION_INPUT");
  });
});
