from conftest import register_default, submit_default


def test_registers_policy_with_exact_identity(patchproof, direct_alice):
    register_default(patchproof)

    policy = patchproof.get_release_status("openssl-cve-2024")

    expected_owner = "0x" + direct_alice.hex() if isinstance(direct_alice, bytes) else str(direct_alice)
    assert policy["owner"].lower() == expected_owner.lower()
    assert policy["repository"] == "example/openssl-wrapper"
    assert policy["policy_version"] == "policy-1"
    assert policy["current_revision"] == 0
    assert policy["pending_revision"] == 0
    assert policy["eligible"] is False


def test_rejects_duplicate_policy(patchproof, direct_vm):
    register_default(patchproof)

    with direct_vm.expect_revert("POLICY_EXISTS"):
        register_default(patchproof)


def test_rejects_unbounded_or_malformed_policy_inputs(patchproof, direct_vm):
    with direct_vm.expect_revert("INVALID_REPOSITORY"):
        patchproof.register_policy(
            "bad", "https://evil.example/repo", "CVE-2024-0001",
            "GHSA-AAAA-BBBB-CCCC", "component", "a" * 40,
            "policy-1", 86400, "security-regression", "github-actions",
        )

    with direct_vm.expect_revert("INVALID_TTL"):
        patchproof.register_policy(
            "bad", "owner/repo", "CVE-2024-0001",
            "GHSA-AAAA-BBBB-CCCC", "component", "a" * 40,
            "policy-1", 0, "security-regression", "github-actions",
        )


def test_only_owner_can_submit_and_pending_is_singleton(
    patchproof, direct_vm, direct_bob
):
    register_default(patchproof)

    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("ONLY_POLICY_OWNER"):
            submit_default(patchproof)

    submit_default(patchproof)
    status = patchproof.get_release_status("openssl-cve-2024")
    assert status["pending_revision"] == 1
    assert status["pending_status"] == "CLAIMED"

    with direct_vm.expect_revert("PENDING_REVISION_EXISTS"):
        submit_default(patchproof)


def test_release_and_note_are_bounded(patchproof, direct_vm):
    register_default(patchproof)

    with direct_vm.expect_revert("INVALID_RELEASE_COMMIT"):
        patchproof.submit_claim("openssl-cve-2024", "main", "v1.2.3", "note")

    with direct_vm.expect_revert("EVIDENCE_NOTE_TOO_LONG"):
        patchproof.submit_claim(
            "openssl-cve-2024", "b" * 40, "v1.2.3", "x" * 1001
        )


def test_unknown_policy_views_fail_closed(patchproof):
    status = patchproof.get_release_status("missing")

    assert status["exists"] is False
    assert status["eligible"] is False
    assert patchproof.get_release_eligibility("missing") is False
