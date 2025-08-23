#!/usr/bin/env bash
set -euo pipefail

export CODEX_APPROVAL_MODE=on-request
export CODEX_APPROVALS=on-request
export CODEX_FILESYSTEM_SANDBOX=danger-full-access
export CODEX_NETWORK=enabled

# 在仓库根目录执行 codex，确保读取本地 codex.yml
codex

