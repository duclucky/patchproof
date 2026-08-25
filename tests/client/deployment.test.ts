import { describe, expect, it } from "vitest";

import { parseDeployment } from "@/lib/deployment";

describe("parseDeployment", () => {
  it("accepts a Bradbury deployment only with a complete binding", () => {
    expect(
      parseDeployment({
        network: "testnet_bradbury",
        chainId: 4221,
        rpcUrl: "https://rpc-bradbury.genlayer.com",
        contractAddress: `0x${"1".repeat(40)}`,
        deployTransactionHash: `0x${"2".repeat(64)}`,
        deployedCodeHash: `sha256:${"3".repeat(64)}`,
      }),
    ).toMatchObject({ chainId: 4221, network: "testnet_bradbury" });
  });

  it.each([
    {},
    { network: "testnet_bradbury", chainId: 1 },
    { network: "studionet", chainId: 61999 },
  ])("rejects incomplete or mismatched deployment state %#", (value) => {
    expect(() => parseDeployment(value)).toThrow("INVALID_DEPLOYMENT_STATE");
  });
});
