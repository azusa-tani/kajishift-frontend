# KAJISHIFT フロントエンドサーバー起動スクリプト
# PowerShellで実行: .\scripts\start-server.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "KAJISHIFT フロントエンドサーバー起動" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 現在のディレクトリに移動（スクリプトの親ディレクトリ）
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Split-Path -Parent $scriptPath
Set-Location $projectPath

Write-Host "サーバーを起動しています..." -ForegroundColor Yellow
Write-Host "ブラウザで http://localhost:5500 にアクセスしてください" -ForegroundColor Green
Write-Host ""
Write-Host "停止する場合は Ctrl+C を押してください" -ForegroundColor Yellow
Write-Host ""

# Python 3を試す
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Pythonが見つかりました: $pythonVersion" -ForegroundColor Green
        Write-Host "Python HTTPサーバーを起動します..." -ForegroundColor Yellow
        python -m http.server 5500
    }
} catch {
    Write-Host "Pythonが見つかりません。Node.jsを試します..." -ForegroundColor Yellow
    
    # Node.jsのhttp-serverを試す
    try {
        $nodeVersion = node --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Node.jsが見つかりました: $nodeVersion" -ForegroundColor Green
            Write-Host "http-serverを起動します..." -ForegroundColor Yellow
            npx --yes http-server -p 5500
        }
    } catch {
        Write-Host ""
        Write-Host "エラー: Python または Node.js が必要です" -ForegroundColor Red
        Write-Host ""
        Write-Host "インストール方法:" -ForegroundColor Yellow
        Write-Host "- Python: https://www.python.org/downloads/" -ForegroundColor Cyan
        Write-Host "- Node.js: https://nodejs.org/" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Enterキーを押して終了"
    }
}
