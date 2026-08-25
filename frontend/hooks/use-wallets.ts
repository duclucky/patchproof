"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createWalletRegistry,
  ensureBradbury,
  type Eip1193Provider,
  type WalletAnnouncement,
} from "@/lib/wallet";

type WalletState = {
  wallets: WalletAnnouncement[];
  selected?: WalletAnnouncement;
  account?: `0x${string}`;
  error?: string;
  connecting: boolean;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function useWallets() {
  const registry = useRef(createWalletRegistry());
  const [state, setState] = useState<WalletState>({ wallets: [], connecting: false });

  useEffect(() => {
    const currentRegistry = registry.current;
    const announce = (event: Event) => {
      const detail = (event as CustomEvent<WalletAnnouncement>).detail;
      if (!detail?.info?.uuid || !detail.provider) return;
      currentRegistry.announce(detail);
      setState((current) => ({ ...current, wallets: currentRegistry.list() }));
    };
    window.addEventListener("eip6963:announceProvider", announce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const fallback = window.setTimeout(() => {
      if (currentRegistry.list().length === 0 && window.ethereum) {
        currentRegistry.announce({
          info: {
            uuid: "legacy-injected-provider",
            name: "Injected wallet",
            icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
            rdns: "legacy.injected",
          },
          provider: window.ethereum,
        });
        setState((current) => ({ ...current, wallets: currentRegistry.list() }));
      }
    }, 100);
    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener("eip6963:announceProvider", announce);
      currentRegistry.clear();
    };
  }, []);

  const disconnect = useCallback(() => {
    setState((current) => ({ wallets: current.wallets, connecting: false }));
  }, []);

  const connect = useCallback(async (wallet: WalletAnnouncement) => {
    setState((current) => ({ ...current, connecting: true, error: undefined }));
    try {
      await ensureBradbury(wallet.provider);
      const accounts = await wallet.provider.request({ method: "eth_requestAccounts" });
      const account = Array.isArray(accounts) ? accounts[0] : undefined;
      if (typeof account !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(account)) {
        throw new Error("Wallet did not return a valid account");
      }
      setState((current) => ({
        ...current,
        selected: wallet,
        account: account as `0x${string}`,
        connecting: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        connecting: false,
        error: error instanceof Error ? error.message : "Wallet connection failed",
      }));
    }
  }, []);

  return { ...state, connect, disconnect };
}
