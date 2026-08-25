export type DeploymentBinding = {
  network: "testnet_bradbury";
  chainId: 4221;
  rpcUrl: "https://rpc-bradbury.genlayer.com";
  sourceHash: `sha256:${string}`;
  deployerAddress: `0x${string}`;
};

export type SubmittedDeployment = DeploymentBinding & {
  version: 1;
  phase: "SUBMITTED";
  deployTransactionHash: `0x${string}`;
};

export type FinalizedDeployment = Omit<SubmittedDeployment, "phase"> & {
  phase: "FINALIZED";
  contractAddress: `0x${string}`;
};

export type FailedDeployment = Omit<SubmittedDeployment, "phase"> & {
  phase: "FINALIZED_FAILED";
  failureCode: string;
};

export type VerifiedDeployment = Omit<FinalizedDeployment, "phase"> & {
  phase: "VERIFIED";
  deployedCodeHash: `sha256:${string}`;
  schemaHash: `sha256:${string}`;
  verifiedAt: string;
};

export function assertDeploymentBinding(
  state: SubmittedDeployment | FinalizedDeployment | VerifiedDeployment | FailedDeployment,
  binding: DeploymentBinding,
): void;
export function submitState(
  binding: DeploymentBinding,
  deployTransactionHash: `0x${string}`,
): SubmittedDeployment;
export function finalizeState(
  state: SubmittedDeployment,
  contractAddress: `0x${string}`,
): FinalizedDeployment;
export function failState(
  state: SubmittedDeployment,
  failureCode: string,
): FailedDeployment;
export function verifyState(
  state: FinalizedDeployment,
  evidence: Pick<VerifiedDeployment, "deployedCodeHash" | "schemaHash" | "verifiedAt">,
): VerifiedDeployment;
