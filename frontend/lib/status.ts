export type UnknownReleaseStatus = { kind: "unknown"; eligible: false };
export type AbsentReleaseStatus = {
  kind: "absent";
  eligible: false;
  currentRevision: 0;
  pendingRevision: 0;
  pendingStatus: "";
};
export type KnownReleaseStatus = {
  kind: "known";
  eligible: boolean;
  owner: string;
  repository: string;
  cveId: string;
  githubAdvisoryId: string;
  component: string;
  baseCommit: string;
  policyVersion: string;
  ttlSeconds: number;
  expectedCheckName: string;
  expectedCheckApp: string;
  currentRevision: number;
  pendingRevision: number;
  lastRevision: number;
  pendingStatus: string;
};

export type ReleaseStatus =
  | UnknownReleaseStatus
  | AbsentReleaseStatus
  | KnownReleaseStatus;

export type RevisionStatus =
  | "CLAIMED"
  | "EVALUATING"
  | "REMEDIATED"
  | "NOT_REMEDIATED"
  | "UNVERIFIABLE";

export type ReleaseRevision = {
  revision: number;
  submitter: string;
  releaseCommit: string;
  releaseTag: string;
  evidenceNote: string;
  status: RevisionStatus;
  verdictReason: string;
  evidenceHash: string;
  evaluatedAt: number;
  expiresAt: number;
  challenged: boolean;
  challengeReason: string;
  challengeOf: number;
};

export const unknownReleaseStatus: UnknownReleaseStatus = {
  kind: "unknown",
  eligible: false,
};

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("INVALID_RELEASE_STATUS");
  }
  return value as Record<string, unknown>;
}

function stringField(value: unknown): string {
  if (typeof value !== "string") throw new Error("INVALID_RELEASE_STATUS");
  return value;
}

function integerField(value: unknown): number {
  const numeric = typeof value === "bigint" ? Number(value) : value;
  if (
    typeof numeric !== "number" ||
    !Number.isSafeInteger(numeric) ||
    numeric < 0
  ) {
    throw new Error("INVALID_RELEASE_STATUS");
  }
  return numeric;
}

export function parseReleaseStatus(value: unknown): ReleaseStatus {
  const raw = record(value);
  if (typeof raw.exists !== "boolean" || typeof raw.eligible !== "boolean") {
    throw new Error("INVALID_RELEASE_STATUS");
  }
  if (!raw.exists) {
    if (
      raw.eligible ||
      integerField(raw.current_revision) !== 0 ||
      integerField(raw.pending_revision) !== 0 ||
      stringField(raw.pending_status) !== ""
    ) {
      throw new Error("INVALID_RELEASE_STATUS");
    }
    return {
      kind: "absent",
      eligible: false,
      currentRevision: 0,
      pendingRevision: 0,
      pendingStatus: "",
    };
  }

  return {
    kind: "known",
    eligible: raw.eligible,
    owner: stringField(raw.owner),
    repository: stringField(raw.repository),
    cveId: stringField(raw.cve_id),
    githubAdvisoryId: stringField(raw.github_advisory_id),
    component: stringField(raw.component),
    baseCommit: stringField(raw.base_commit),
    policyVersion: stringField(raw.policy_version),
    ttlSeconds: integerField(raw.ttl_seconds),
    expectedCheckName: stringField(raw.expected_check_name),
    expectedCheckApp: stringField(raw.expected_check_app),
    currentRevision: integerField(raw.current_revision),
    pendingRevision: integerField(raw.pending_revision),
    lastRevision: integerField(raw.last_revision),
    pendingStatus: stringField(raw.pending_status),
  };
}

export function parseRevision(value: unknown): ReleaseRevision {
  try {
    const raw = record(value);
    const status = stringField(raw.status) as RevisionStatus;
    if (
      raw.exists !== true ||
      !["CLAIMED", "EVALUATING", "REMEDIATED", "NOT_REMEDIATED", "UNVERIFIABLE"].includes(status) ||
      typeof raw.challenged !== "boolean"
    ) {
      throw new Error("INVALID_REVISION");
    }
    return {
      revision: integerField(raw.revision),
      submitter: stringField(raw.submitter),
      releaseCommit: stringField(raw.release_commit),
      releaseTag: stringField(raw.release_tag),
      evidenceNote: stringField(raw.evidence_note),
      status,
      verdictReason: stringField(raw.verdict_reason),
      evidenceHash: stringField(raw.evidence_hash),
      evaluatedAt: integerField(raw.evaluated_at),
      expiresAt: integerField(raw.expires_at),
      challenged: raw.challenged,
      challengeReason: stringField(raw.challenge_reason),
      challengeOf: integerField(raw.challenge_of),
    };
  } catch {
    throw new Error("INVALID_REVISION");
  }
}
