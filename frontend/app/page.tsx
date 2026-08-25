"use client";

import {
  ArrowClockwise,
  ArrowSquareOut,
  CheckCircle,
  DownloadSimple,
  FileText,
  GithubLogo,
  Lightning,
  ListChecks,
  MagnifyingGlass,
  PaperPlaneTilt,
  ShieldCheck,
  Wallet,
  WarningCircle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

import { RegistrationForm } from "@/components/registration-form";
import { StatusCard } from "@/components/status-card";
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
import { unknownReleaseStatus, type ReleaseStatus } from "@/lib/status";
import {
  initialTransaction,
  transitionTransaction,
  type TransactionState,
} from "@/lib/transaction";

const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const deployedContract = "0xa803A6CE6eB741a9c864462c312e45177fb20E56";
const configuredAddress = process.env.NEXT_PUBLIC_PATCHPROOF_CONTRACT ?? deployedContract;

type Action = "register" | "submit" | "evaluate" | "challenge";
type WorkflowTab = "inspect" | "register" | "submit" | "evaluate" | "challenge";

const workflowTabs: Array<{
  id: WorkflowTab;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  { id: "inspect", label: "Inspect", description: "Canonical read", icon: <MagnifyingGlass size={18} aria-hidden="true" /> },
  { id: "register", label: "Register", description: "Bind policy", icon: <ListChecks size={18} aria-hidden="true" /> },
  { id: "submit", label: "Submit", description: "Exact release", icon: <PaperPlaneTilt size={18} aria-hidden="true" /> },
  { id: "evaluate", label: "Evaluate", description: "Validator verdict", icon: <Lightning size={18} aria-hidden="true" /> },
  { id: "challenge", label: "Challenge", description: "Dispute revision", icon: <WarningCircle size={18} aria-hidden="true" /> },
];

function short(value: string) {
  return value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

function statusLabel(status: ReleaseStatus) {
  if (status.kind === "known" && status.eligible) return "Protected";
  if (status.kind === "absent") return "No policy yet";
  return "Needs review";
}

function claimLabel(status: ReleaseStatus) {
  if (status.kind === "known" && status.currentRevision > 0) return `Release proof #${status.currentRevision}`;
  return "No verified release yet";
}

function DetailCell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn" | "danger";
}) {
  return (
    <div className={`detail-cell detail-cell--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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
  const [activeTab, setActiveTab] = useState<WorkflowTab>("inspect");
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
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
      case "submitted": return "Submitted - waiting for finalized execution";
      case "accepted": return "Accepted - waiting for finality";
      case "reloading": return "Finalized - reloading canonical consequence";
      case "confirmed": return "Canonical state reloaded";
      case "error": return transaction.message;
    }
  }, [transaction]);

  const activeWorkflow = workflowTabs.find((item) => item.id === activeTab) ?? workflowTabs[0];
  const walletSummary = wallet.account ? "Wallet connected" : "Connect wallet";
  const nextStep = writeReady ? "Submit or evaluate a release" : "Connect wallet to update";

  useEffect(() => {
    if (wallet.account) setWalletDialogOpen(false);
  }, [wallet.account]);

  useEffect(() => {
    if (!walletDialogOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWalletDialogOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [walletDialogOpen]);

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
    <main className="app-shell">
      <header className="command-header">
        <a className="brand" href="#top" aria-label="PatchProof home">
          <ShieldCheck size={28} weight="fill" aria-hidden="true" />
          <span>PatchProof</span>
        </a>
        <div className="header-cluster" aria-label="Deployment state">
          <span className={status.kind === "known" && status.eligible ? "ready-pill ready-pill--good" : "ready-pill"}>
            {statusLabel(status)}
          </span>
          <span className={writeReady ? "ready-pill ready-pill--good" : "ready-pill"}>
            {walletSummary}
          </span>
        </div>
      </header>

      <section className="console-hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Release protection</p>
          <h1 id="hero-title">Release protection status</h1>
          <p>
            Check whether this release has a verified remediation claim, submit new release proof,
            or challenge a result that should not be trusted.
          </p>
        </div>
        <div className="hero-stack" aria-label="Operational summary">
          <DetailCell
            label="Protection"
            value={statusLabel(status)}
            tone={status.kind === "known" && status.eligible ? "good" : "warn"}
          />
          <DetailCell label="Current claim" value={claimLabel(status)} />
          <DetailCell label="Next step" value={nextStep} />
          <DetailCell label="Wallet" value={walletSummary} tone={writeReady ? "good" : "warn"} />
        </div>
      </section>

      <div className="console-grid">
        <section className="panel workflow-panel" aria-labelledby="workflow-title">
          <div className="panel-heading">
            <div>
              <p className="step">Workflow</p>
              <h2 id="workflow-title">Release operations</h2>
            </div>
            <span className="panel-kicker">{activeWorkflow.description}</span>
          </div>

          <div className="workflow-tabs" role="tablist" aria-label="PatchProof workflow">
            {workflowTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className="workflow-tab"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <section
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-label={activeWorkflow.label}
            aria-labelledby={`tab-${activeTab}`}
            className="tab-panel"
          >
            {activeTab === "inspect" ? (
              <div className="inspect-layout">
                {statusQuery.isError ? (
                  <p className="alert" role="alert">
                    Canonical read failed. The release remains ineligible. {statusQuery.error.message}
                  </p>
                ) : null}
                <StatusCard status={status} />
                <div className="panel-actions">
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => void statusQuery.refetch()}
                    disabled={!validAddress || statusQuery.isFetching}
                    aria-label="Reload canonical status"
                  >
                    <ArrowClockwise size={18} className={statusQuery.isFetching ? "spin" : ""} aria-hidden="true" />
                    Reload status
                  </button>
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => void downloadVex()}
                    disabled={status.kind !== "known" || status.currentRevision === 0}
                  >
                    <DownloadSimple size={18} aria-hidden="true" /> Export OpenVEX
                  </button>
                </div>
                <details className="technical-details">
                  <summary>
                    <span>Technical details</span>
                    <small>For audits and troubleshooting</small>
                  </summary>
                  <div className="field-grid">
                    <label>
                      Contract address
                      <input
                        value={address}
                        onChange={(event) => setAddress(event.target.value.trim())}
                        placeholder="0x..."
                        spellCheck={false}
                        aria-invalid={address.length > 0 && !validAddress}
                      />
                    </label>
                    <label>
                      Policy ID
                      <input value={policyId} onChange={(event) => setPolicyId(event.target.value)} placeholder="release-policy" />
                    </label>
                  </div>
                  <div className="technical-grid">
                    <DetailCell label="Network" value="Bradbury testnet" />
                    <DetailCell label="Chain ID" value="4221" />
                    <DetailCell label="Contract" value={validAddress ? address : "Invalid or missing"} tone={validAddress ? "good" : "danger"} />
                    <DetailCell label="Policy ID" value={policyId || "Missing"} tone={policyId.length >= 3 ? "neutral" : "danger"} />
                  </div>
                  <div className="panel-actions">
                    <a className="button button--ghost" href="https://github.com/duclucky/patchproof" target="_blank" rel="noreferrer">
                      <GithubLogo size={18} aria-hidden="true" /> Source <ArrowSquareOut size={14} aria-hidden="true" />
                    </a>
                    <a className="button button--ghost" href={explorer} target="_blank" rel="noreferrer">
                      Explorer <ArrowSquareOut size={14} aria-hidden="true" />
                    </a>
                  </div>
                </details>
              </div>
            ) : null}

            {activeTab === "register" ? (
              <RegistrationForm
                policyId={policyId}
                setPolicyId={setPolicyId}
                disabled={!writeReady || activeAction !== null}
                onRegister={registerPolicy}
              />
            ) : null}

            {activeTab === "submit" ? (
              <form className="action-form" onSubmit={submitClaim}>
                <h3>Submit exact release</h3>
                <label>
                  40-character commit
                  <input
                    required
                    minLength={40}
                    maxLength={40}
                    pattern="[0-9a-fA-F]{40}"
                    value={releaseCommit}
                    onChange={(event) => setReleaseCommit(event.target.value.trim())}
                  />
                </label>
                <label>
                  Release tag
                  <input required maxLength={128} value={releaseTag} onChange={(event) => setReleaseTag(event.target.value)} />
                </label>
                <label>
                  Evidence note <span>Untrusted context</span>
                  <textarea maxLength={1000} value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} />
                </label>
                <button className="button button--primary" disabled={!writeReady || activeAction !== null}>
                  <PaperPlaneTilt size={18} aria-hidden="true" /> Submit claim
                </button>
              </form>
            ) : null}

            {activeTab === "evaluate" ? (
              <div className="action-form">
                <h3>Evaluate pending claim</h3>
                <p>
                  Validators refetch allowlisted CISA and GitHub evidence, then emit a bounded verdict.
                  The write remains disabled until a Bradbury wallet is connected.
                </p>
                <button
                  className="button button--primary"
                  type="button"
                  disabled={!writeReady || activeAction !== null}
                  onClick={() => void runWrite("evaluate", { functionName: "evaluate", args: [policyId] })}
                >
                  <Lightning size={18} aria-hidden="true" /> Evaluate
                </button>
              </div>
            ) : null}

            {activeTab === "challenge" ? (
              <form className="action-form action-form--danger" onSubmit={submitChallenge}>
                <h3>Challenge current revision</h3>
                <label>
                  Challenge reason
                  <textarea required maxLength={500} value={challengeReason} onChange={(event) => setChallengeReason(event.target.value)} />
                </label>
                <button className="button button--danger" disabled={!writeReady || activeAction !== null}>
                  <WarningCircle size={18} aria-hidden="true" /> Open challenge
                </button>
              </form>
            ) : null}
          </section>

          {!writeReady ? (
            <p className="gate-note">
              Connect a Bradbury wallet and provide a valid contract address to enable writes.
            </p>
          ) : null}
        </section>

        <aside className="panel wallet-panel" aria-labelledby="wallet-title">
          <div className="panel-heading">
            <div>
              <p className="step">Wallet</p>
              <h2 id="wallet-title">Authorization</h2>
            </div>
            <Wallet size={24} aria-hidden="true" />
          </div>
          {wallet.account ? (
            <div className="wallet-connected">
              <p><CheckCircle size={18} weight="fill" aria-hidden="true" /> Connected to Bradbury</p>
              <code>{short(wallet.account)}</code>
              <button type="button" className="button button--ghost" onClick={wallet.disconnect}>Disconnect</button>
            </div>
          ) : (
            <div className="wallet-list">
              <p>Connect only when you are ready to submit, evaluate, or challenge release proof.</p>
              <button type="button" className="button button--primary" onClick={() => setWalletDialogOpen(true)}>
                Connect wallet
              </button>
              {wallet.wallets.length === 0 ? (
                <p className="muted">No EIP-6963 wallet detected.</p>
              ) : (
                <p className="muted">{wallet.wallets.length} compatible wallet{wallet.wallets.length === 1 ? "" : "s"} available.</p>
              )}
            </div>
          )}
          {wallet.error ? <p className="alert" role="alert">{wallet.error}</p> : null}
          <div className={`tx-state tx-state--${transaction.phase}`}>
            <span aria-hidden="true" />
            <div>
              <strong>Write state</strong>
              <p>{txLabel}</p>
              {transaction.hash ? <code>{short(transaction.hash)}</code> : null}
            </div>
          </div>
        </aside>
      </div>

      <section className="boundary">
        <div>
          <p className="step">Claim boundary</p>
          <h2>Proof of a bounded release consequence, not a blanket security certificate.</h2>
        </div>
        <div className="boundary-grid">
          <article>
            <FileText size={22} aria-hidden="true" />
            <h3>It binds</h3>
            <p>Named public evidence to an exact release identity, validator decision, TTL, and challenge lifecycle.</p>
          </article>
          <article>
            <ShieldCheck size={22} aria-hidden="true" />
            <h3>It fails closed</h3>
            <p>Unavailable, malformed, mismatched, expired, challenged, or unknown states never become eligible.</p>
          </article>
          <article>
            <WarningCircle size={22} aria-hidden="true" />
            <h3>It does not certify</h3>
            <p>Repository-wide security, legal compliance, production readiness, adoption, or future safety.</p>
          </article>
        </div>
      </section>

      <footer>
        <span>PatchProof reference implementation</span>
        <span>GenLayer Bradbury testnet</span>
      </footer>

      {walletDialogOpen && !wallet.account ? (
        <div className="modal-backdrop" onMouseDown={() => setWalletDialogOpen(false)}>
          <section
            className="wallet-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-dialog-title"
            aria-describedby="wallet-dialog-copy"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-heading">
              <div>
                <p className="step">Wallet</p>
                <h2 id="wallet-dialog-title">Connect wallet</h2>
              </div>
              <button
                type="button"
                className="dialog-close"
                onClick={() => setWalletDialogOpen(false)}
                autoFocus
              >
                Close
              </button>
            </div>
            <p id="wallet-dialog-copy">
              Choose the wallet you want to use. PatchProof never reads or stores private keys.
            </p>
            <div className="wallet-list wallet-list--dialog">
              {wallet.wallets.length === 0 ? (
                <p className="muted">No EIP-6963 wallet detected.</p>
              ) : (
                wallet.wallets.map((item) => (
                  <button className="wallet-option" type="button" key={item.info.uuid} onClick={() => void wallet.connect(item)} disabled={wallet.connecting}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.info.icon} alt="" width="28" height="28" />
                    <span>{item.info.name}</span>
                  </button>
                ))
              )}
            </div>
            {wallet.error ? <p className="alert" role="alert">{wallet.error}</p> : null}
          </section>
        </div>
      ) : null}
    </main>
  );
}
