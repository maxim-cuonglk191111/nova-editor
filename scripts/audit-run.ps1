# Runs builder-audit specs against production with the Supabase cleanup keys loaded.
#   pwsh scripts/audit-run.ps1 e2e/builder-audit/canvas.spec.ts
param([Parameter(ValueFromRemainingArguments = $true)] $Specs)
$envFile = Join-Path $PSScriptRoot "../apps/nova-builder/.env.local"
Get-Content $envFile | Where-Object { $_ -match '^(SUPABASE_URL|SUPABASE_SERVICE_KEY)=' } | ForEach-Object {
  $k, $v = $_ -split '=', 2
  Set-Item "env:$k" $v.Trim('"')
}
if (-not $env:BASE_URL) { $env:BASE_URL = "https://nova-editor.maximi.workers.dev" }
npx playwright test -c playwright.cloud.config.ts @Specs
