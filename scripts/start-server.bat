@echo off
chcp 65001 >nul
cd /d "%~dp0\.."
echo ========================================
echo KAJISHIFT フロントエンドサーバー起動
echo ========================================
echo.
echo サーバーを起動しています...
echo ブラウザで http://localhost:5500 にアクセスしてください
echo.
echo 停止する場合は Ctrl+C を押してください
echo.

REM Python 3を試す
python -m http.server 5500 2>nul
if %errorlevel% neq 0 (
    echo Pythonが見つかりません。Node.jsを試します...
    REM Node.jsのhttp-serverを試す
    npx --yes http-server -p 5500
    if %errorlevel% neq 0 (
        echo.
        echo エラー: Python または Node.js が必要です
        echo.
        echo インストール方法:
        echo - Python: https://www.python.org/downloads/
        echo - Node.js: https://nodejs.org/
        echo.
        pause
    )
)
