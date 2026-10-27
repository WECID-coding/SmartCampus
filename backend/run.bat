@echo off
echo ========================================================
echo   SmartCampus MITS Gwalior - Starting FastAPI Backend
echo   URL: http://127.0.0.1:8000
echo   Docs: http://127.0.0.1:8000/docs
echo ========================================================
cd /d "%~dp0"
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
