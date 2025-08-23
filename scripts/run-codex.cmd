@echo off
set CODEX_APPROVAL_MODE=on-request
set CODEX_APPROVALS=on-request
set CODEX_FILESYSTEM_SANDBOX=danger-full-access
set CODEX_NETWORK=enabled

REM 在仓库根目录执行 codex，确保读取本地 codex.yml
codex

