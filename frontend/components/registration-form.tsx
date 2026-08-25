import { FormEvent, useState } from "react";

import type { RegistrationInput } from "@/lib/actions";

export function RegistrationForm({
  policyId,
  setPolicyId,
  disabled,
  onRegister,
}: {
  policyId: string;
  setPolicyId: (value: string) => void;
  disabled: boolean;
  onRegister: (input: RegistrationInput) => void;
}) {
  const [repository, setRepository] = useState("");
  const [cveId, setCveId] = useState("");
  const [githubAdvisoryId, setGithubAdvisoryId] = useState("");
  const [component, setComponent] = useState("");
  const [baseCommit, setBaseCommit] = useState("");
  const [policyVersion, setPolicyVersion] = useState("v1");
  const [ttlSeconds, setTtlSeconds] = useState("86400");
  const [expectedCheckName, setExpectedCheckName] = useState("release");
  const [expectedCheckApp, setExpectedCheckApp] = useState("github-actions");

  function submit(event: FormEvent) {
    event.preventDefault();
    onRegister({
      policyId,
      repository,
      cveId,
      githubAdvisoryId,
      component,
      baseCommit,
      policyVersion,
      ttlSeconds: Number(ttlSeconds),
      expectedCheckName,
      expectedCheckApp,
    });
  }

  return (
    <details className="registration">
      <summary>Register an immutable policy</summary>
      <form onSubmit={submit}>
        <div className="registration-grid">
          <label>Policy ID<input required minLength={3} maxLength={64} value={policyId} onChange={(event) => setPolicyId(event.target.value)} /></label>
          <label>Repository <span>owner/name</span><input required pattern="[A-Za-z0-9._-]+/[A-Za-z0-9._-]+" value={repository} onChange={(event) => setRepository(event.target.value)} /></label>
          <label>CVE ID<input required pattern="CVE-[0-9]{4}-[0-9]{4,7}" placeholder="CVE-2025-12345" value={cveId} onChange={(event) => setCveId(event.target.value)} /></label>
          <label>GitHub advisory<input required pattern="GHSA-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}" placeholder="GHSA-xxxx-xxxx-xxxx" value={githubAdvisoryId} onChange={(event) => setGithubAdvisoryId(event.target.value)} /></label>
          <label>Component<input required maxLength={128} value={component} onChange={(event) => setComponent(event.target.value)} /></label>
          <label>Base commit<input required minLength={40} maxLength={40} pattern="[0-9a-fA-F]{40}" value={baseCommit} onChange={(event) => setBaseCommit(event.target.value.trim())} /></label>
          <label>Policy version<input required maxLength={64} value={policyVersion} onChange={(event) => setPolicyVersion(event.target.value)} /></label>
          <label>TTL in seconds<input required type="number" min={3600} max={31536000} step={1} value={ttlSeconds} onChange={(event) => setTtlSeconds(event.target.value)} /></label>
          <label>Expected check name<input required maxLength={128} value={expectedCheckName} onChange={(event) => setExpectedCheckName(event.target.value)} /></label>
          <label>Expected check app<input required maxLength={128} value={expectedCheckApp} onChange={(event) => setExpectedCheckApp(event.target.value)} /></label>
        </div>
        <button className="button button--primary" disabled={disabled}>Register policy</button>
      </form>
    </details>
  );
}
