import crypto from "node:crypto";
import fs from "node:fs/promises";
import { chains, createAccount, createClient } from "genlayer-js";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";

import { runPreflight } from "./preflight.mjs";
import {
  assertDeploymentBinding,
  failState,
  finalizeState,
  submitState,
  verifyState,
} from "./state.mjs";

const CONTRACT_PATH = new URL("../contracts/PatchProof.py", import.meta.url);
const STATE_PATH = new URL("./state.json", import.meta.url);

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

async function loadState() {
  try {
    return JSON.parse(await fs.readFile(STATE_PATH, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return null;
    throw error;
  }
}

async function saveState(state) {
  await fs.writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, {
    encoding: "utf8",
    flush: true,
  });
}

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const code = await fs.readFile(CONTRACT_PATH, "utf8");
  const account = privateKey ? createAccount(privateKey) : null;
  const recoveryHash = process.env.DEPLOY_TRANSACTION_HASH;
  const recoveryDeployer = process.env.DEPLOYER_ADDRESS;
  const deployerAddress = account?.address ?? recoveryDeployer;
  if (!deployerAddress) throw new Error("DEPLOYER_AUTHORITY_NOT_PRESENT");
  const binding = {
    network: "testnet_bradbury",
    chainId: 4221,
    rpcUrl: chains.testnetBradbury.rpcUrls.default.http[0],
    sourceHash: sha256(code),
    deployerAddress,
  };
  const client = createClient({
    chain: chains.testnetBradbury,
    ...(account ? { account } : {}),
  });
  let state = await loadState();
  if (state) assertDeploymentBinding(state, binding);
  if (state?.phase === "FINALIZED_FAILED") {
    throw new Error(`FINALIZED_DEPLOYMENT_FAILED:${state.failureCode}`);
  }
  if (!state) {
    let deployTransactionHash = recoveryHash;
    if (!deployTransactionHash) {
      if (!account) throw new Error("DEPLOYER_PRIVATE_KEY_NOT_PRESENT");
      const preflight = await runPreflight();
      if (!preflight.account.present || !preflight.account.funded) {
        throw new Error("DEPLOYER_ACCOUNT_NOT_FUNDED");
      }
      deployTransactionHash = await client.deployContract({ code, args: [] });
    }
    state = submitState(binding, deployTransactionHash);
    await saveState(state);
  }

  if (state.phase === "SUBMITTED") {
    const receipt = await client.waitForTransactionReceipt({
      hash: state.deployTransactionHash,
      status: TransactionStatus.FINALIZED,
      interval: 3_000,
      retries: 200,
    });
    if (receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) {
      state = failState(
        state,
        String(receipt.txExecutionResultName ?? "EXECUTION_RESULT_MISSING"),
      );
      await saveState(state);
      throw new Error(`FINALIZED_DEPLOYMENT_FAILED:${state.failureCode}`);
    }
    const transaction = await client.getTransaction({ hash: state.deployTransactionHash });
    const contractAddress = transaction.txDataDecoded?.contractAddress;
    if (!contractAddress) throw new Error("FINALIZED_CONTRACT_ADDRESS_MISSING");
    state = finalizeState(state, contractAddress);
    await saveState(state);
  }

  if (state.phase === "FINALIZED") {
    const [deployedCode, schema, absentStatus] = await Promise.all([
      client.getContractCode(state.contractAddress),
      client.getContractSchema(state.contractAddress),
      client.readContract({
        address: state.contractAddress,
        functionName: "get_release_status",
        args: ["deployment-smoke-absent"],
      }),
    ]);
    if (sha256(deployedCode) !== binding.sourceHash) {
      throw new Error("DEPLOYED_CODE_HASH_MISMATCH");
    }
    if (
      absentStatus === null ||
      typeof absentStatus !== "object" ||
      absentStatus.exists !== false ||
      absentStatus.eligible !== false
    ) {
      throw new Error("CANONICAL_SMOKE_READ_MISMATCH");
    }
    state = verifyState(state, {
      deployedCodeHash: sha256(deployedCode),
      schemaHash: sha256(JSON.stringify(schema)),
      verifiedAt: new Date().toISOString(),
    });
    await saveState(state);
  }

  console.log(
    JSON.stringify({
      ok: true,
      phase: state.phase,
      network: state.network,
      chainId: state.chainId,
      deployTransactionHash: state.deployTransactionHash,
      contractAddress: state.contractAddress,
      deployedCodeHash: state.deployedCodeHash,
      schemaHash: state.schemaHash,
    }),
  );
}

try {
  await main();
} catch (error) {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "DEPLOYMENT_FAILED",
    }),
  );
  process.exitCode = 1;
}
