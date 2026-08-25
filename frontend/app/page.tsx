"use client";

import {
  ArrowClockwise,
  ArrowSquareOut,
  CheckCircle,
  DownloadSimple,
  GithubLogo,
  ShieldCheck,
  Wallet,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";

import { StatusCard } from "@/components/status-card";
import { RegistrationForm } from "@/components/registration-form";
import { useWallets } from "@/hooks/use-wallets";
import { buildRegistrationRequest, type RegistrationInput } from "@/lib/actions";
import {
  readReleaseStatus,
  readRevision,
  writeAndFinalize,
  type ContractAddress,
  type WriteRequest,
} from "@/lib/gateway";
import { toOpenVex } from "@/lib/openvex";
import { unknownReleaseStatus } from "@/lib/status";
import {
  initialTransaction,
  transitionTransaction,
  type TransactionState,
} from "@/lib/transaction";

const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const configuredAddress = process.env.NEXT_PUBLIC_PATCHPROOF_CONTRACT ?? "";

type Action = "register" | "submit" | "evaluate" | "challenge";

function short(value: string) {
  return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

export default function Home() {
  const [address, setAddress] = useState(configuredAddress);
  const [policyId, setPolicyId] = useState("demo-policy");
  const [releaseCommit, setReleaseCommit] = useState("");
  const [releaseTag, setReleaseTag] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [challengeReason, setChallengeReason] = useState("");
  const [transaction, setTransaction] = useState<TransactionState>(initialTransaction);
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const wallet = useWallets();
  const validAddress = addressPattern.test(address);

  const statusQuery = useQuery({
    queryKey: ["release-status", address, policyId],
    queryFn: () => readReleaseStatus(address as ContractAddress, policyId),
    enabled: validAddress && policyId.length >= 3,
  });
  const status = statusQuery.data ?? unknownReleaseStatus;
  const explorer = validAddress
    ? `https://explorer-bradbury.genlayer.com/address/${address}`
    : "https://explorer-bradbury.genlayer.com/";

  const writeReady = Boolean(wallet.account && wallet.selected && validAddress);
  const txLabel = useMemo(() => {
    switch (transaction.phase) {
      case "idle": return "No write submitted";
      case "submitted": return "Submitted — waiting for finalized execution";
      case "accepted": return "Accepted — waiting for finality";
      case "reloading": return "Finalized — reloading canonical consequence";
      case "confirmed": return "Canonical state reloaded";
      case "error": return transaction.message;
    }
  }, [transaction]);

  async function runWrite(action: Action, request: WriteRequest) {
    if (!writeReady || !wallet.account || !wallet.selected) return;
    setActiveAction(action);
    setTransaction(initialTransaction);
    try {
      await writeAndFinalize({
        address: address as ContractAddress,
        account: wallet.account,
        provider: wallet.selected.provider,
        request,
        onSubmitted: (hash) =>
          setTransaction((current) =>
            transitionTransaction(current, { type: "submitted", hash }),
          ),
        onAccepted: () =>
          setTransaction((current) =>
            transitionTransaction(current, { type: "accepted" }),
          ),
      });
      setTransaction((current) => transitionTransaction(current, { type: "finalized" }));
      await statusQuery.refetch();
      setTransaction((current) => transitionTransaction(current, { type: "reloaded" }));
    } catch (error) {
      setTransaction((current) =>
        transitionTransaction(current, {
          type: "failed",
          message: error instanceof Error ? error.message : "Write failed",
        }),
      );
    } finally {
      setActiveAction(null);
    }
  }

  function submitClaim(event: FormEvent) {
    event.preventDefault();
    void runWrite("submit", {
      functionName: "submit_claim",
      args: [policyId, releaseCommit, releaseTag, evidenceNote],
    });
  }

  function registerPolicy(input: RegistrationInput) {
    void runWrite("register", buildRegistrationRequest(input));
  }

  function submitChallenge(event: FormEvent) {
    event.preventDefault();
    void runWrite("challenge", {
      functionName: "challenge",
      args: [policyId, challengeReason],
    });
  }

  async function downloadVex() {
    if (status.kind !== "known" || status.currentRevision === 0 || !validAddress) return;
    const revision = await readRevision(
      address as ContractAddress,
      policyId,
      status.currentRevision,
    );
    const document = toOpenVex({
      policyId,
      repository: status.repository,
      cveId: status.cveId,
      component: status.component,
      releaseCommit: revision.releaseCommit,
      releaseTag: revision.releaseTag,
      status:
        revision.status === "REMEDIATED" ||
        revision.status === "NOT_REMEDIATED" ||
        revision.status === "UNVERIFIABLE"
          ? revision.status
          : "UNVERIFIABLE",
      challenged: revision.challenged,
      eligible: status.eligible,
      evidenceHash: revision.evidenceHash,
      verdictReason: revision.verdictReason,
      evaluatedAt: revision.evaluatedAt,
    });
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(document, null, 2)], { type: "application/json" }),
    );
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `patchproof-${policyId}-openvex.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="PatchProof home">
          <ShieldCheck size={28} weight="fill" aria-hidden="true" />
          <span>PatchProof</span>
        </a>
        <div className="network-pill"><span />Bradbury · 4221</div>
        <a className="text-link" href="https://github.com/duclucky/patchproof" target="_blank" rel="noreferrer">
          <GithubLogo size={20} aria-hidden="true" /> Source <ArrowSquareOut size={14} aria-hidden="true" />
        </a>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">Evidence-bound release remediation</p>
          <h1>Turn a patch claim into a challengeable release consequence.</h1>
        </div>
        <p className="hero__copy">
          PatchProof binds one repository, vulnerability, component, commit, release, check identity,
          policy version, and evidence hash. It is a reference project—not a security audit or guarantee.
        </p>
      </section>

      <div className="workspace">
        <section className="panel panel--status" aria-labelledby="lookup-title">
          <div className="panel__heading">
            <div><p className="step">01 / Inspect</p><h2 id="lookup-title">Canonical release status</h2></div>
            <button className="icon-button" type="button" onClick={() => void statusQuery.refetch()} disabled={!validAddress || statusQuery.isFetching} aria-label="Reload canonical status">
              <ArrowClockwise size={20} className={statusQuery.isFetching ? "spin" : ""} aria-hidden="true" />
            </button>
          </div>
          <div className="field-grid">
            <label>Contract address<input value={address} onChange={(event) => setAddress(event.target.value.trim())} placeholder="0x…" spellCheck={false} aria-invalid={address.length > 0 && !validAddress} /></label>
            <label>Policy ID<input value={policyId} onChange={(event) => setPolicyId(event.target.value)} placeholder="release-policy" /></label>
          </div>
          {statusQuery.isError ? <p className="alert" role="alert">Canonical read failed. The release remains ineligible. {statusQuery.error.message}</p> : null}
          <StatusCard status={status} />
          <div className="panel__actions">
            <button className="button button--secondary" type="button" onClick={() => void downloadVex()} disabled={status.kind !== "known" || status.currentRevision === 0}>
              <DownloadSimple size={18} aria-hidden="true" /> Export OpenVEX
            </button>
            <a className="button button--ghost" href={explorer} target="_blank" rel="noreferrer">Explorer <ArrowSquareOut size={16} aria-hidden="true" /></a>
          </div>
        </section>

        <aside className="panel panel--wallet" aria-labelledby="wallet-title">
          <div className="panel__heading"><div><p className="step">02 / Authorize</p><h2 id="wallet-title">Wallet</h2></div><Wallet size={24} aria-hidden="true" /></div>
          {wallet.account ? (
            <div className="wallet-connected">
              <p><CheckCircle size={18} weight="fill" aria-hidden="true" /> Connected to Bradbury</p>
              <code>{short(wallet.account)}</code>
              <button type="button" className="button button--ghost" onClick={wallet.disconnect}>Disconnect</button>
            </div>
          ) : (
            <div className="wallet-list">
              <p>Select an announced wallet. PatchProof never reads or stores private keys.</p>
              {wallet.wallets.length === 0 ? <p className="muted">No EIP-6963 wallet detected.</p> : wallet.wallets.map((item) => (
                <button className="wallet-option" type="button" key={item.info.uuid} onClick={() => void wallet.connect(item)} disabled={wallet.connecting}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.info.icon} alt="" width="28" height="28" />
                  <span>{item.info.name}</span>
                </button>
              ))}
            </div>
          )}
          {wallet.error ? <p className="alert" role="alert">{wallet.error}</p> : null}
          <div className={`tx-state tx-state--${transaction.phase}`}>
            <span aria-hidden="true" />
            <div><strong>Write state</strong><p>{txLabel}</p>{transaction.hash ? <code>{short(transaction.hash)}</code> : null}</div>
          </div>
        </aside>

        <section className="panel panel--actions" aria-labelledby="actions-title">
          <div className="panel__heading"><div><p className="step">03 / Act</p><h2 id="actions-title">Release workflow</h2></div></div>
          <RegistrationForm
            policyId={policyId}
            setPolicyId={setPolicyId}
            disabled={!writeReady || activeAction !== null}
            onRegister={registerPolicy}
          />
          <div className="action-columns">
            <form onSubmit={submitClaim}>
              <h3>Submit exact release</h3>
              <label>40-character commit<input required minLength={40} maxLength={40} pattern="[0-9a-fA-F]{40}" value={releaseCommit} onChange={(event) => setReleaseCommit(event.target.value.trim())} /></label>
              <label>Release tag<input required maxLength={128} value={releaseTag} onChange={(event) => setReleaseTag(event.target.value)} /></label>
              <label>Evidence note <span>Untrusted context</span><textarea maxLength={1000} value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} /></label>
              <button className="button button--primary" disabled={!writeReady || activeAction !== null}>Submit claim</button>
            </form>
            <div className="action-stack">
              <div><h3>Evaluate pending claim</h3><p>Validators refetch allowlisted CISA and GitHub evidence, then reach a bounded verdict.</p><button className="button button--primary" type="button" disabled={!writeReady || activeAction !== null} onClick={() => void runWrite("evaluate", { functionName: "evaluate", args: [policyId] })}>Evaluate</button></div>
              <form onSubmit={submitChallenge}><h3>Challenge current revision</h3><label>Challenge reason<textarea required maxLength={500} value={challengeReason} onChange={(event) => setChallengeReason(event.target.value)} /></label><button className="button button--danger" disabled={!writeReady || activeAction !== null}>Open challenge</button></form>
            </div>
          </div>
          {!writeReady ? <p className="gate-note">Connect a Bradbury wallet and provide a valid contract address to enable writes.</p> : null}
        </section>
      </div>

      <section className="boundary">
        <p className="step">Claim boundary</p>
        <h2>What this project proves—and what it does not.</h2>
        <div className="boundary-grid">
          <article><h3>It binds</h3><p>Named public evidence to an exact release identity, validator decision, TTL, and challenge lifecycle.</p></article>
          <article><h3>It fails closed</h3><p>Unavailable, malformed, mismatched, expired, challenged, or unknown states never become eligible.</p></article>
          <article><h3>It does not certify</h3><p>Repository-wide security, legal compliance, production readiness, adoption, or future safety.</p></article>
        </div>
      </section>

      <footer><span>PatchProof · reference implementation</span><span>GenLayer Bradbury testnet</span></footer>
    </main>
  );
}
