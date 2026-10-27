@echo off
echo ========================================================
echo   SmartCampus MITS - Production Multi-Worker Server
echo   Engineered for 4,000+ Concurrent Students & Faculty
echo   Workers: 4  |  Mode: High Concurrency WAL
echo   API:  http://127.0.0.1:8000
echo   Docs: http://127.0.0.1:8000/docs
echo ========================================================
cd /d "%~dp0backend"
if exist ".\.venv\Scripts\python.exe" (
    .\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
) else (
    echo [INFO] Local .venv not found, using system Python...
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
)
pause
