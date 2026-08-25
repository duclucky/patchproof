import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildGenVmPositionalArgs, chains, createAccount, createClient } from "genlayer-js";

const CONTRACT_PATH = new URL("../contracts/PatchProof.py", import.meta.url);
const EXPECTED_METHODS = [
  "challenge",
  "evaluate",
  "get_release_eligibility",
  "get_release_status",
  "get_revision",
  "register_policy",
  "submit_claim",
];

const WRITE_SAMPLES = {
  register_policy: {
    policy_id: "preflight-policy",
    repository: "owner/repository",
    cve_id: "CVE-2025-12345",
    github_advisory_id: "GHSA-abcd-efgh-ijkl",
    component: "component",
    base_commit: "a".repeat(40),
    policy_version: "v1",
    ttl_seconds: 86400,
    expected_check_name: "release",
    expected_check_app: "github-actions",
  },
  submit_claim: {
    policy_id: "preflight-policy",
    release_commit: "b".repeat(40),
    release_tag: "v1.0.0",
    evidence_note: "preflight only",
  },
  evaluate: { policy_id: "preflight-policy" },
  challenge: { policy_id: "preflight-policy", reason: "preflight only" },
};

export async function runPreflight() {
  const code = await fs.readFile(CONTRACT_PATH, "utf8");
  const client = createClient({ chain: chains.testnetBradbury });
  const [chainIdHex, gasPrice, schema] = await Promise.all([
    client.request({ method: "eth_chainId" }),
    client.getGasPrice(),
    client.getContractSchemaForCode(code),
  ]);
  const chainId = Number.parseInt(String(chainIdHex), 16);
  if (chainId !== 4221) throw new Error("BRADBURY_CHAIN_ID_MISMATCH");

  const methodNames = Object.keys(schema.methods).sort();
  if (JSON.stringify(methodNames) !== JSON.stringify(EXPECTED_METHODS)) {
    throw new Error("CONTRACT_SCHEMA_MISMATCH");
  }
  const abiRoundTrips = Object.entries(WRITE_SAMPLES).map(([functionName, values]) => ({
    functionName,
    argumentCount: buildGenVmPositionalArgs({
      schema,
      functionName,
      valuesByParamName: values,
      strictTypes: true,
    }).length,
  }));

  const result = {
    network: "testnet_bradbury",
    chainId,
    rpcUrl: chains.testnetBradbury.rpcUrls.default.http[0],
    gasPriceWei: gasPrice.toString(),
    schemaMethodCount: methodNames.length,
    schemaMethods: methodNames,
    abiRoundTrips,
    account: { present: false },
  };
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (privateKey) {
    const account = createAccount(privateKey);
    const balance = await client.getBalance({ address: account.address });
    result.account = {
      present: true,
      address: account.address,
      balanceWei: balance.toString(),
      funded: balance > 0n,
    };
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(await runPreflight(), null, 2));
  } catch (error) {
    console.error(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "PREFLIGHT_FAILED",
      }),
    );
    process.exitCode = 1;
  }
}
