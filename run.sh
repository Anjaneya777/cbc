#!/usr/bin/env bash
set -e

echo "Starting AI-Based Contract Risk Indicator..."

# Start backend in background
echo "Starting FastAPI Backend on http://localhost:8000..."
cd "$(dirname "$0")/backend"
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "Starting Vite Frontend on http://localhost:5173..."
cd "../frontend"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo "Both servers running. Press Ctrl+C to terminate."
wait
