import { describe, expect, it } from "vitest";

import { initialTransaction, transitionTransaction } from "@/lib/transaction";

describe("transaction state", () => {
  it("requires a canonical reload after finality", () => {
    const submitted = transitionTransaction(initialTransaction, {
      type: "submitted",
      hash: `0x${"a".repeat(64)}`,
    });
    const accepted = transitionTransaction(submitted, { type: "accepted" });
    expect(accepted).toMatchObject({ phase: "accepted", canonical: false });
    const finalized = transitionTransaction(accepted, { type: "finalized" });
    expect(finalized).toMatchObject({ phase: "reloading", canonical: false });
    const confirmed = transitionTransaction(finalized, { type: "reloaded" });
    expect(confirmed).toMatchObject({ phase: "confirmed", canonical: true });
  });

  it("cannot confirm a write that was never finalized", () => {
    expect(() =>
      transitionTransaction(initialTransaction, { type: "reloaded" }),
    ).toThrow("INVALID_TRANSACTION_TRANSITION");
  });

  it("cannot skip accepted finality", () => {
    const submitted = transitionTransaction(initialTransaction, {
      type: "submitted",
      hash: `0x${"a".repeat(64)}`,
    });
    expect(() =>
      transitionTransaction(submitted, { type: "finalized" }),
    ).toThrow("INVALID_TRANSACTION_TRANSITION");
  });

  it("preserves a useful error while failing closed", () => {
    expect(
      transitionTransaction(initialTransaction, {
        type: "failed",
        message: "Wallet rejected the request",
      }),
    ).toMatchObject({ phase: "error", canonical: false });
  });
});
