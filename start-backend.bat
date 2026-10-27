@echo off
echo ========================================================
echo   SmartCampus MITS - Launching Backend Server
echo   API:  http://127.0.0.1:8000
echo   Docs: http://127.0.0.1:8000/docs
echo ========================================================
cd /d "%~dp0backend"
if exist ".\.venv\Scripts\python.exe" (
    .\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
) else (
    echo [INFO] Local .venv not found, using system Python...
    python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
)
pause
