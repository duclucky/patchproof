export type TransactionState =
  | { phase: "idle"; canonical: false; hash?: undefined; message?: undefined }
  | { phase: "submitted"; canonical: false; hash: string; message?: undefined }
  | { phase: "accepted"; canonical: false; hash: string; message?: undefined }
  | { phase: "reloading"; canonical: false; hash: string; message?: undefined }
  | { phase: "confirmed"; canonical: true; hash: string; message?: undefined }
  | { phase: "error"; canonical: false; hash?: string; message: string };

export type TransactionEvent =
  | { type: "reset" }
  | { type: "submitted"; hash: string }
  | { type: "accepted" }
  | { type: "finalized" }
  | { type: "reloaded" }
  | { type: "failed"; message: string };

export const initialTransaction: TransactionState = {
  phase: "idle",
  canonical: false,
};

export function transitionTransaction(
  state: TransactionState,
  event: TransactionEvent,
): TransactionState {
  if (event.type === "reset") return initialTransaction;
  if (event.type === "failed") {
    return {
      phase: "error",
      canonical: false,
      ...(state.hash ? { hash: state.hash } : {}),
      message: event.message,
    };
  }
  if (event.type === "submitted" && state.phase === "idle") {
    return { phase: "submitted", canonical: false, hash: event.hash };
  }
  if (event.type === "accepted" && state.phase === "submitted") {
    return { phase: "accepted", canonical: false, hash: state.hash };
  }
  if (event.type === "finalized" && state.phase === "accepted") {
    return { phase: "reloading", canonical: false, hash: state.hash };
  }
  if (event.type === "reloaded" && state.phase === "reloading") {
    return { phase: "confirmed", canonical: true, hash: state.hash };
  }
  throw new Error("INVALID_TRANSACTION_TRANSITION");
}
