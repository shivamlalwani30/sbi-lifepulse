#!/bin/bash
# SBI LifePulse — One-command startup
# Usage: ./start.sh

set -e

echo ""
echo "⚡ SBI LifePulse — Starting up..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for .env
if [ ! -f .env ]; then
  echo "❌  .env file not found!"
  echo "    Run: cp .env.example .env"
  echo "    Then add your ANTHROPIC_API_KEY"
  exit 1
fi

# Load env
export $(cat .env | grep -v '#' | xargs)

if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "sk-ant-your-key-here" ]; then
  echo "❌  ANTHROPIC_API_KEY not set in .env"
  exit 1
fi

echo "✅  API key found"
echo ""

# Start backend
echo "🚀  Starting FastAPI backend on http://localhost:8000 ..."
cd backend
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3
echo "✅  Backend running (PID $BACKEND_PID)"
echo ""

# Start frontend
echo "🚀  Starting Next.js frontend on http://localhost:3000 ..."
cd frontend
npm install -q
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  SBI LifePulse is running!"
echo ""
echo "   Dashboard  →  http://localhost:3000"
echo "   API docs   →  http://localhost:8000/docs"
echo ""
echo "   Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait and cleanup on Ctrl+C
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
