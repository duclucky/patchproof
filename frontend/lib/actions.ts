import type { WriteRequest } from "@/lib/gateway";

export type RegistrationInput = {
  policyId: string;
  repository: string;
  cveId: string;
  githubAdvisoryId: string;
  component: string;
  baseCommit: string;
  policyVersion: string;
  ttlSeconds: number;
  expectedCheckName: string;
  expectedCheckApp: string;
};

export function buildRegistrationRequest(input: RegistrationInput): WriteRequest {
  if (!Number.isSafeInteger(input.ttlSeconds)) {
    throw new Error("INVALID_REGISTRATION_INPUT");
  }
  return {
    functionName: "register_policy",
    args: [
      input.policyId,
      input.repository,
      input.cveId,
      input.githubAdvisoryId,
      input.component,
      input.baseCommit,
      input.policyVersion,
      input.ttlSeconds,
      input.expectedCheckName,
      input.expectedCheckApp,
    ],
  };
}
