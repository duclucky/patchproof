import { CheckCircle, Hourglass, ShieldWarning } from "@phosphor-icons/react/dist/ssr";

import type { ReleaseStatus } from "@/lib/status";

export function StatusCard({ status }: { status: ReleaseStatus }) {
  const eligible = status.kind === "known" && status.eligible;
  const Icon = eligible ? CheckCircle : status.kind === "known" ? Hourglass : ShieldWarning;
  return (
    <section className={`status-card ${eligible ? "status-card--eligible" : ""}`} aria-live="polite">
      <div className="status-card__signal">
        <Icon aria-hidden="true" size={24} weight="bold" />
        <span>{eligible ? "Eligible" : "Not eligible"}</span>
      </div>
      {status.kind === "unknown" ? (
        <p>No canonical status loaded. Unknown always fails closed.</p>
      ) : status.kind === "absent" ? (
        <p>No registered policy exists for this identifier.</p>
      ) : (
        <dl className="status-grid">
          <div><dt>Repository</dt><dd>{status.repository}</dd></div>
          <div><dt>Vulnerability</dt><dd>{status.cveId}</dd></div>
          <div><dt>Component</dt><dd>{status.component}</dd></div>
          <div><dt>Current revision</dt><dd>{status.currentRevision || "None"}</dd></div>
          <div><dt>Pending</dt><dd>{status.pendingStatus || "None"}</dd></div>
          <div><dt>Policy</dt><dd>{status.policyVersion}</dd></div>
        </dl>
      )}
    </section>
  );
}
