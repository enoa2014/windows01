$Env:CODEX_APPROVAL_MODE = "on-request"
$Env:CODEX_APPROVALS = "on-request"
$Env:CODEX_FILESYSTEM_SANDBOX = "danger-full-access"
$Env:CODEX_NETWORK = "enabled"

# 在仓库根目录执行 codex，确保读取本地 codex.yml
codex

