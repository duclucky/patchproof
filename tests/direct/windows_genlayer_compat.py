"""Version-scoped Windows compatibility for genlayer-test 0.29.2.

The upstream direct loader unlinks a temporary file immediately after duplicating
its handle onto stdin. POSIX permits unlinking an open file; Windows does not.
Keep the file until stdin is restored by VMContext cleanup, then remove it on the
next deployment or interpreter exit.
"""

from __future__ import annotations

import atexit
import os
import tempfile
from pathlib import Path


_deferred_paths: list[Path] = []


def _cleanup_deferred() -> None:
    remaining: list[Path] = []
    for path in _deferred_paths:
        try:
            path.unlink(missing_ok=True)
        except PermissionError:
            remaining.append(path)
    _deferred_paths[:] = remaining


def _inject_message_to_fd0_windows(vm) -> None:
    from genlayer.py import calldata
    from genlayer.py.types import Address

    _cleanup_deferred()

    sender_addr = Address(vm.sender) if isinstance(vm.sender, bytes) else vm.sender
    contract_addr = (
        Address(vm._contract_address)
        if isinstance(vm._contract_address, bytes)
        else vm._contract_address
    )
    origin_addr = Address(vm.origin) if isinstance(vm.origin, bytes) else vm.origin
    encoded = calldata.encode(
        {
            "contract_address": contract_addr,
            "sender_address": sender_addr,
            "origin_address": origin_addr,
            "stack": [],
            "value": vm._value,
            "datetime": vm._datetime,
            "is_init": False,
            "chain_id": vm._chain_id,
            "entry_kind": 0,
            "entry_data": b"",
            "entry_stage_data": None,
        }
    )

    fd, raw_path = tempfile.mkstemp()
    path = Path(raw_path)
    try:
        os.write(fd, encoded)
        os.lseek(fd, 0, os.SEEK_SET)
        vm._original_stdin_fd = os.dup(0)
        os.dup2(fd, 0)
    finally:
        os.close(fd)
        _deferred_paths.append(path)


def install() -> None:
    if os.name != "nt":
        return
    from gltest.direct import loader

    loader._inject_message_to_fd0 = _inject_message_to_fd0_windows


atexit.register(_cleanup_deferred)
