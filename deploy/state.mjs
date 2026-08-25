const NETWORK = "testnet_bradbury";
const CHAIN_ID = 4221;
const RPC_URL = "https://rpc-bradbury.genlayer.com";
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const TRANSACTION = /^0x[0-9a-fA-F]{64}$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;

function validBinding(binding) {
  return (
    binding !== null &&
    typeof binding === "object" &&
    binding.network === NETWORK &&
    binding.chainId === CHAIN_ID &&
    binding.rpcUrl === RPC_URL &&
    typeof binding.sourceHash === "string" &&
    SHA256.test(binding.sourceHash) &&
    typeof binding.deployerAddress === "string" &&
    ADDRESS.test(binding.deployerAddress)
  );
}

export function assertDeploymentBinding(state, binding) {
  if (
    !validBinding(binding) ||
    state.network !== binding.network ||
    state.chainId !== binding.chainId ||
    state.rpcUrl !== binding.rpcUrl ||
    state.sourceHash !== binding.sourceHash ||
    state.deployerAddress.toLowerCase() !== binding.deployerAddress.toLowerCase()
  ) {
    throw new Error("DEPLOYMENT_BINDING_MISMATCH");
  }
}

export function submitState(binding, deployTransactionHash) {
  if (!validBinding(binding) || !TRANSACTION.test(deployTransactionHash)) {
    throw new Error("INVALID_DEPLOYMENT_STATE");
  }
  return {
    version: 1,
    ...binding,
    phase: "SUBMITTED",
    deployTransactionHash,
  };
}

export function finalizeState(state, contractAddress) {
  if (state.phase !== "SUBMITTED" || !ADDRESS.test(contractAddress)) {
    throw new Error("INVALID_DEPLOYMENT_TRANSITION");
  }
  return { ...state, phase: "FINALIZED", contractAddress };
}

export function failState(state, failureCode) {
  if (
    state.phase !== "SUBMITTED" ||
    typeof failureCode !== "string" ||
    !/^[A-Z0-9_]{3,80}$/.test(failureCode)
  ) {
    throw new Error("INVALID_DEPLOYMENT_TRANSITION");
  }
  return { ...state, phase: "FINALIZED_FAILED", failureCode };
}

export function verifyState(state, evidence) {
  if (
    state.phase !== "FINALIZED" ||
    !SHA256.test(evidence.deployedCodeHash) ||
    !SHA256.test(evidence.schemaHash) ||
    typeof evidence.verifiedAt !== "string" ||
    !evidence.verifiedAt.endsWith("Z")
  ) {
    throw new Error("INVALID_DEPLOYMENT_TRANSITION");
  }
  return { ...state, phase: "VERIFIED", ...evidence };
}
