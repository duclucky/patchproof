import { describe, expect, it } from "vitest";

import {
  assertDeploymentBinding,
  failState,
  finalizeState,
  submitState,
  verifyState,
} from "../../deploy/state.mjs";
import type { DeploymentBinding } from "../../deploy/state.mjs";

const binding: DeploymentBinding = {
  network: "testnet_bradbury" as const,
  chainId: 4221,
  rpcUrl: "https://rpc-bradbury.genlayer.com",
  sourceHash: `sha256:${"a".repeat(64)}`,
  deployerAddress: `0x${"1".repeat(40)}`,
};

describe("resumable deployment state", () => {
  it("creates a submitted checkpoint without secret material", () => {
    expect(
      submitState(binding, `0x${"2".repeat(64)}`),
    ).toEqual({
      version: 1,
      ...binding,
      phase: "SUBMITTED",
      deployTransactionHash: `0x${"2".repeat(64)}`,
    });
  });

  it("rejects source or deployer drift before resume", () => {
    const state = submitState(binding, `0x${"2".repeat(64)}`);
    expect(() =>
      assertDeploymentBinding(state, { ...binding, sourceHash: `sha256:${"b".repeat(64)}` }),
    ).toThrow("DEPLOYMENT_BINDING_MISMATCH");
  });

  it("advances without replay from submitted to finalized to verified", () => {
    const submitted = submitState(binding, `0x${"2".repeat(64)}`);
    const finalized = finalizeState(submitted, `0x${"3".repeat(40)}`);
    expect(finalized.phase).toBe("FINALIZED");
    const verified = verifyState(finalized, {
      deployedCodeHash: binding.sourceHash,
      schemaHash: `sha256:${"4".repeat(64)}`,
      verifiedAt: "2026-08-25T12:00:00Z",
    });
    expect(verified).toMatchObject({
      phase: "VERIFIED",
      contractAddress: `0x${"3".repeat(40)}`,
      deployedCodeHash: binding.sourceHash,
    });
  });

  it("cannot finalize or verify out of order", () => {
    const submitted = submitState(binding, `0x${"2".repeat(64)}`);
    expect(() => verifyState(submitted as never, {
      deployedCodeHash: binding.sourceHash,
      schemaHash: `sha256:${"4".repeat(64)}`,
      verifiedAt: "2026-08-25T12:00:00Z",
    })).toThrow("INVALID_DEPLOYMENT_TRANSITION");
  });

  it("records a sanitized finalized failure without allowing replay", () => {
    const submitted = submitState(binding, `0x${"2".repeat(64)}`);
    expect(failState(submitted, "FINISHED_WITH_ERROR")).toMatchObject({
      phase: "FINALIZED_FAILED",
      failureCode: "FINISHED_WITH_ERROR",
    });
  });
});
