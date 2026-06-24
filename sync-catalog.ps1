#!/usr/bin/env pwsh
# sync-catalog.ps1
# Commita o banco de dados local e faz push para o Vercel redesploar automaticamente.
# Uso: ./sync-catalog.ps1 "Mensagem opcional do commit"

param(
    [string]$Message = "chore: update catalog database"
)

Set-Location $PSScriptRoot

Write-Host "`n[1/3] Adicionando banco de dados ao staging..." -ForegroundColor Cyan
git add db/catalog.db
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao fazer git add. Verifique se o repositório está configurado." -ForegroundColor Red
    exit 1
}

$status = git status --short
if (-not $status) {
    Write-Host "`nNenhuma alteracao no banco. Nada a commitar." -ForegroundColor Yellow
    exit 0
}

Write-Host "[2/3] Commitando com a mensagem: '$Message'" -ForegroundColor Cyan
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no commit." -ForegroundColor Red
    exit 1
}

Write-Host "[3/3] Enviando para o GitHub -> Vercel vai redesploar automaticamente..." -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no push." -ForegroundColor Red
    exit 1
}

Write-Host "`n✓ Catalogo sincronizado com sucesso!" -ForegroundColor Green
Write-Host "  O Vercel vai redesploar em ~30-60 segundos." -ForegroundColor Gray
Write-Host "  Acompanhe em: https://vercel.com/antenorefilhos/pedidos-alf" -ForegroundColor Gray
