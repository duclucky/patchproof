import { describe, expect, it, vi } from "vitest";

import {
  createWalletRegistry,
  ensureBradbury,
  type Eip1193Provider,
} from "@/lib/wallet";

describe("wallet helpers", () => {
  it("deduplicates EIP-6963 announcements by uuid", () => {
    const registry = createWalletRegistry();
    const provider = { request: vi.fn() } as unknown as Eip1193Provider;
    registry.announce({
      info: { uuid: "wallet-1", name: "Wallet", icon: "data:image/png;base64,AA==", rdns: "io.wallet" },
      provider,
    });
    registry.announce({
      info: { uuid: "wallet-1", name: "Wallet renamed", icon: "data:image/png;base64,AA==", rdns: "io.wallet" },
      provider,
    });
    expect(registry.list()).toHaveLength(1);
  });

  it("switches to Bradbury when the current chain is different", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce("0x1")
      .mockResolvedValueOnce(null);
    await ensureBradbury({ request } as Eip1193Provider);
    expect(request).toHaveBeenLastCalledWith({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x107d" }],
    });
  });

  it("does not request a switch when already on Bradbury", async () => {
    const request = vi.fn().mockResolvedValue("0x107d");
    await ensureBradbury({ request } as Eip1193Provider);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("adds Bradbury only when the wallet reports an unknown chain", async () => {
    const unknownChain = Object.assign(new Error("unknown chain"), { code: 4902 });
    const request = vi
      .fn()
      .mockResolvedValueOnce("0x1")
      .mockRejectedValueOnce(unknownChain)
      .mockResolvedValueOnce(null);
    await ensureBradbury({ request } as Eip1193Provider);
    expect(request).toHaveBeenLastCalledWith({
      method: "wallet_addEthereumChain",
      params: [
        expect.objectContaining({
          chainId: "0x107d",
          chainName: "GenLayer Bradbury Testnet",
          rpcUrls: ["https://rpc-bradbury.genlayer.com"],
        }),
      ],
    });
  });
});
