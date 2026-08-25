import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusCard } from "@/components/status-card";

describe("StatusCard", () => {
  it("labels unknown state as ineligible", () => {
    render(<StatusCard status={{ kind: "unknown", eligible: false }} />);
    expect(screen.getByText("Not eligible")).toBeInTheDocument();
    expect(screen.getByText(/No canonical status loaded/i)).toBeInTheDocument();
  });

  it("shows the exact bound release state", () => {
    render(
      <StatusCard
        status={{
          kind: "known",
          eligible: true,
          owner: `0x${"1".repeat(40)}`,
          repository: "acme/widget",
          cveId: "CVE-2025-12345",
          githubAdvisoryId: "GHSA-abcd-efgh-ijkl",
          component: "widget-core",
          baseCommit: "a".repeat(40),
          policyVersion: "v1",
          ttlSeconds: 86400,
          expectedCheckName: "release",
          expectedCheckApp: "github-actions",
          currentRevision: 2,
          pendingRevision: 0,
          lastRevision: 2,
          pendingStatus: "",
        }}
      />,
    );
    expect(screen.getByText("Eligible")).toBeInTheDocument();
    expect(screen.getByText("acme/widget")).toBeInTheDocument();
    expect(screen.getByText("CVE-2025-12345")).toBeInTheDocument();
  });
});
