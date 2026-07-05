@echo off
echo.
echo ⚡ SBI LifePulse — Starting up...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REM Check .env exists
if not exist .env (
    echo ❌ .env not found. Copy .env.example to .env and add your key.
    pause
    exit /b 1
)

REM Start backend in new window
echo 🚀 Starting backend...
start "LifePulse Backend" cmd /k "cd backend && pip install -r requirements.txt -q && uvicorn main:app --reload --port 8000"

REM Wait a moment
timeout /t 4 /nobreak >nul

REM Start frontend in new window
echo 🚀 Starting frontend...
start "LifePulse Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ✅ Both windows launched!
echo    Dashboard → http://localhost:3000
echo    API docs  → http://localhost:8000/docs
echo.
pause
