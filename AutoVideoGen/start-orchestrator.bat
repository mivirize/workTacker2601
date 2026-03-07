@echo off
echo ============================================
echo   AutoVideoGen Orchestrator
echo ============================================
echo.

cd /d "%~dp0"

REM Check Python version
python --version 2>nul
if errorlevel 1 (
    echo ERROR: Python not found in PATH
    pause
    exit /b 1
)

REM Install dependencies if needed
echo Checking dependencies...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r orchestrator\requirements.txt
)

REM Run database migration
echo Running database migration...
python orchestrator\migrate_db.py

echo.
echo Starting API server on http://localhost:8000
echo Press Ctrl+C to stop
echo.

REM Start the API server from parent directory
python -m uvicorn orchestrator.api.main:app --host 0.0.0.0 --port 8000
