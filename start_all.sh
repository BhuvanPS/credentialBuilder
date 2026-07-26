#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

function cleanup {
  echo "Stopping all services..."
  kill "$EXTRACTOR_PID" "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$EXTRACTOR_PID" "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM

for port in 8000 8001; do
  pids=$(lsof -t -iTCP:$port -sTCP:LISTEN -P -n || true)
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port: $pids"
    printf '%s\n' "$pids" | xargs kill -9 || true
  fi
done

cd "$ROOT_DIR/linkedin-extract"
echo "Starting LinkedIn extractor on port 8000..."
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000 &
EXTRACTOR_PID=$!

sleep 1
cd "$ROOT_DIR"
echo "Starting backend on port 8001..."
python3 -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

sleep 1
cd "$ROOT_DIR/frontend"
echo "Starting frontend on port 5173/5174..."
npm run dev &
FRONTEND_PID=$!

cd "$ROOT_DIR"
echo "All services started: extractor=$EXTRACTOR_PID backend=$BACKEND_PID frontend=$FRONTEND_PID"
echo "Press CTRL+C to stop."
wait