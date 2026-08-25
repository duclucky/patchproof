export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export type WalletAnnouncement = {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: Eip1193Provider;
};

export function createWalletRegistry() {
  const wallets = new Map<string, WalletAnnouncement>();
  return {
    announce(wallet: WalletAnnouncement) {
      if (!wallets.has(wallet.info.uuid)) wallets.set(wallet.info.uuid, wallet);
    },
    list() {
      return [...wallets.values()];
    },
    clear() {
      wallets.clear();
    },
  };
}

const BRADBURY_CHAIN_ID = "0x107d";

export async function ensureBradbury(provider: Eip1193Provider): Promise<void> {
  const current = await provider.request({ method: "eth_chainId" });
  if (String(current).toLowerCase() === BRADBURY_CHAIN_ID) return;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BRADBURY_CHAIN_ID }],
    });
  } catch (error) {
    const code =
      error !== null && typeof error === "object" && "code" in error
        ? Number(error.code)
        : 0;
    if (code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: BRADBURY_CHAIN_ID,
          chainName: "GenLayer Bradbury Testnet",
          nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
          rpcUrls: ["https://rpc-bradbury.genlayer.com"],
          blockExplorerUrls: ["https://explorer-bradbury.genlayer.com/"],
        },
      ],
    });
  }
}
