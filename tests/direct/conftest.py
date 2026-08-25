import json

import pytest

from windows_genlayer_compat import install as install_windows_genlayer_compat

install_windows_genlayer_compat()

CONTRACT = "contracts/PatchProof.py"


@pytest.fixture
def patchproof(direct_deploy, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    return direct_deploy(CONTRACT)


def register_default(contract):
    contract.register_policy(
        "openssl-cve-2024",
        "example/openssl-wrapper",
        "CVE-2024-0001",
        "GHSA-AAAA-BBBB-CCCC",
        "openssl-wrapper",
        "a" * 40,
        "policy-1",
        86400,
        "security-regression",
        "github-actions",
    )


def submit_default(contract, note="Maintainer says the release remediates the issue."):
    contract.submit_claim(
        "openssl-cve-2024",
        "b" * 40,
        "v1.2.3",
        note,
    )


def mock_authoritative_evidence(vm, *, check_conclusion="success", cve="CVE-2024-0001"):
    vm.mock_web(
        r"known_exploited_vulnerabilities\.json",
        {
            "status": 200,
            "body": json.dumps(
                {
                    "catalogVersion": "2026.08.25",
                    "vulnerabilities": [
                        {
                            "cveID": cve,
                            "vendorProject": "Example",
                            "product": "OpenSSL Wrapper",
                            "vulnerabilityName": "Example memory issue",
                            "shortDescription": "A memory safety issue is exploited in the wild.",
                            "requiredAction": "Apply vendor remediation.",
                            "dateAdded": "2026-08-01",
                            "dueDate": "2026-08-22",
                        }
                    ],
                }
            ),
        },
    )
    vm.mock_web(
        r"api\.github\.com/advisories/GHSA-AAAA-BBBB-CCCC",
        {
            "status": 200,
            "body": json.dumps(
                {
                    "ghsa_id": "GHSA-AAAA-BBBB-CCCC",
                    "cve_id": cve,
                    "summary": "Memory issue in openssl-wrapper",
                    "description": "Bounds validation is missing before the affected copy.",
                    "vulnerabilities": [
                        {
                            "package": {"ecosystem": "pip", "name": "openssl-wrapper"},
                            "vulnerable_version_range": "< 1.2.3",
                            "first_patched_version": {"identifier": "1.2.3"},
                        }
                    ],
                }
            ),
        },
    )
    vm.mock_web(
        r"/compare/a{40}\.\.\.b{40}",
        {
            "status": 200,
            "body": json.dumps(
                {
                    "status": "ahead",
                    "ahead_by": 2,
                    "base_commit": {"sha": "a" * 40},
                    "merge_base_commit": {"sha": "a" * 40},
                    "commits": [{"sha": "b" * 40}],
                    "files": [
                        {
                            "filename": "src/bounds.py",
                            "status": "modified",
                            "patch": "+if length > buffer_size: raise ValueError('bounds')",
                        },
                        {
                            "filename": "tests/test_bounds.py",
                            "status": "modified",
                            "patch": "+def test_rejects_oversized_copy(): ...",
                        },
                    ],
                }
            ),
        },
    )
    vm.mock_web(
        r"/releases/tags/v1\.2\.3",
        {
            "status": 200,
            "body": json.dumps(
                {
                    "tag_name": "v1.2.3",
                    "target_commitish": "b" * 40,
                    "published_at": "2026-08-24T00:00:00Z",
                    "body": "Fix bounds validation for CVE-2024-0001.",
                }
            ),
        },
    )
    vm.mock_web(
        r"/commits/b{40}/check-runs",
        {
            "status": 200,
            "body": json.dumps(
                {
                    "check_runs": [
                        {
                            "name": "security-regression",
                            "status": "completed",
                            "conclusion": check_conclusion,
                            "app": {"slug": "github-actions"},
                        }
                    ]
                }
            ),
        },
    )


def mock_verdict(vm, verdict="REMEDIATED", reason="Patch and regression check address the bounded issue."):
    vm.mock_llm(
        r"PATCHPROOF_VERDICT_V1",
        json.dumps({"verdict": verdict, "reason": reason}),
    )
