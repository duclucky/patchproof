export type RevisionForExport = {
  policyId: string;
  repository: string;
  cveId: string;
  component: string;
  releaseCommit: string;
  releaseTag: string;
  status: "REMEDIATED" | "NOT_REMEDIATED" | "UNVERIFIABLE";
  challenged: boolean;
  eligible: boolean;
  evidenceHash: string;
  verdictReason: string;
  evaluatedAt: number;
};

export type OpenVexDocument = {
  "@context": string;
  "@id": string;
  author: string;
  role: string;
  version: number;
  timestamp: string;
  statements: Array<{
    vulnerability: { name: string };
    products: Array<{ "@id": string; subcomponents: Array<{ "@id": string }> }>;
    status: "fixed" | "affected" | "under_investigation";
    status_notes: string;
    action_statement: string;
  }>;
};

export function toOpenVex(revision: RevisionForExport): OpenVexDocument {
  const fixed =
    revision.status === "REMEDIATED" &&
    revision.eligible &&
    !revision.challenged;
  const status = fixed
    ? "fixed"
    : revision.status === "NOT_REMEDIATED"
      ? "affected"
      : "under_investigation";
  const timestamp = new Date(revision.evaluatedAt * 1000).toISOString();
  return {
    "@context": "https://openvex.dev/ns/v0.2.0",
    "@id": `https://patchproof.dev/vex/${encodeURIComponent(revision.policyId)}/${revision.releaseCommit}`,
    author: "PatchProof reference implementation",
    role: "Document Creator",
    version: 1,
    timestamp,
    statements: [
      {
        vulnerability: { name: revision.cveId },
        products: [
          {
            "@id": `pkg:github/${revision.repository}@${revision.releaseCommit}`,
            subcomponents: [{ "@id": revision.component }],
          },
        ],
        status,
        status_notes: `${revision.verdictReason} Evidence: ${revision.evidenceHash || "unavailable"}.`,
        action_statement: fixed
          ? `Release ${revision.releaseTag} is eligible only under the recorded PatchProof policy and TTL.`
          : "Treat this release as ineligible until a canonical unchallenged REMEDIATED revision is current.",
      },
    ],
  };
}
