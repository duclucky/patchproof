export type Deployment = {
  network: "testnet_bradbury";
  chainId: 4221;
  rpcUrl: "https://rpc-bradbury.genlayer.com";
  contractAddress: `0x${string}`;
  deployTransactionHash: `0x${string}`;
  deployedCodeHash: `sha256:${string}`;
};

const address = /^0x[0-9a-fA-F]{40}$/;
const transaction = /^0x[0-9a-fA-F]{64}$/;
const sha256 = /^sha256:[0-9a-f]{64}$/;

export function parseDeployment(value: unknown): Deployment {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("INVALID_DEPLOYMENT_STATE");
  }
  const raw = value as Record<string, unknown>;
  if (
    raw.network !== "testnet_bradbury" ||
    raw.chainId !== 4221 ||
    raw.rpcUrl !== "https://rpc-bradbury.genlayer.com" ||
    typeof raw.contractAddress !== "string" ||
    !address.test(raw.contractAddress) ||
    typeof raw.deployTransactionHash !== "string" ||
    !transaction.test(raw.deployTransactionHash) ||
    typeof raw.deployedCodeHash !== "string" ||
    !sha256.test(raw.deployedCodeHash)
  ) {
    throw new Error("INVALID_DEPLOYMENT_STATE");
  }
  return raw as Deployment;
}
