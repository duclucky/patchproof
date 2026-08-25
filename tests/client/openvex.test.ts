import { describe, expect, it } from "vitest";

import { toOpenVex, type RevisionForExport } from "@/lib/openvex";

describe("toOpenVex", () => {
  it("exports eligible remediation as a fixed statement with exact bindings", () => {
    const document = toOpenVex({
      policyId: "widget-cve",
      repository: "acme/widget",
      cveId: "CVE-2025-12345",
      component: "widget-core",
      releaseCommit: "b".repeat(40),
      releaseTag: "v2.1.0",
      status: "REMEDIATED",
      challenged: false,
      eligible: true,
      evidenceHash: `sha256:${"c".repeat(64)}`,
      verdictReason: "Exact release contains the bounded remediation.",
      evaluatedAt: 1_700_000_000,
    });
    expect(document.statements[0]).toMatchObject({
      vulnerability: { name: "CVE-2025-12345" },
      status: "fixed",
      products: [{ "@id": `pkg:github/acme/widget@${"b".repeat(40)}` }],
    });
  });

  it.each<Partial<RevisionForExport>>([
    { status: "UNVERIFIABLE", eligible: false },
    { status: "REMEDIATED", eligible: false },
    { status: "REMEDIATED", eligible: true, challenged: true },
  ])("never emits fixed for an unsafe state %#", (override) => {
    const base: RevisionForExport = {
      policyId: "widget-cve",
      repository: "acme/widget",
      cveId: "CVE-2025-12345",
      component: "widget-core",
      releaseCommit: "b".repeat(40),
      releaseTag: "v2.1.0",
      status: "NOT_REMEDIATED",
      challenged: false,
      eligible: false,
      evidenceHash: "",
      verdictReason: "Not fixed.",
      evaluatedAt: 1_700_000_000,
    };
    const document = toOpenVex({ ...base, ...override });
    expect(document.statements[0].status).not.toBe("fixed");
  });
});
