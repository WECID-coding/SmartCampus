Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SmartCampus MITS Gwalior - Starting FastAPI Backend" -ForegroundColor Green
Write-Host "  URL:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "  Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot
& ".\.venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
