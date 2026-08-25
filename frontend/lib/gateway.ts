import { chains, createClient } from "genlayer-js";
import { TransactionStatus } from "genlayer-js/types";

import { parseReleaseStatus, parseRevision } from "@/lib/status";
import type { Eip1193Provider } from "@/lib/wallet";

export type ContractAddress = `0x${string}`;
export type TransactionHash = `0x${string}`;

function publicClient() {
  return createClient({ chain: chains.testnetBradbury });
}

export async function readReleaseStatus(
  address: ContractAddress,
  policyId: string,
) {
  const value = await publicClient().readContract({
    address,
    functionName: "get_release_status",
    args: [policyId],
  });
  return parseReleaseStatus(value);
}

export async function readRevision(
  address: ContractAddress,
  policyId: string,
  revision: number,
) {
  const value = await publicClient().readContract({
    address,
    functionName: "get_revision",
    args: [policyId, revision],
  });
  return parseRevision(value);
}

export type WriteRequest = {
  functionName: "register_policy" | "submit_claim" | "evaluate" | "challenge";
  args: Array<string | number>;
};

export async function writeAndFinalize(input: {
  address: ContractAddress;
  account: ContractAddress;
  provider: Eip1193Provider;
  request: WriteRequest;
  onSubmitted: (hash: TransactionHash) => void;
  onAccepted: () => void;
}) {
  const client = createClient({
    chain: chains.testnetBradbury,
    account: input.account,
    provider: input.provider as never,
  });
  const hash = await client.writeContract({
    address: input.address,
    functionName: input.request.functionName,
    args: input.request.args,
    value: 0n,
  });
  input.onSubmitted(hash as TransactionHash);
  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    interval: 3_000,
    retries: 100,
  });
  input.onAccepted();
  return client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    interval: 3_000,
    retries: 100,
  });
}
