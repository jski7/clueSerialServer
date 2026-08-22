#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PORT="${PORT:-8090}"
HOST="${HOST:-127.0.0.1}"

echo "clue. serial config — local server"
echo "  config:       http://${HOST}:${PORT}/"
echo "  shutdown fix: http://${HOST}:${PORT}/shutdownfix/"
echo ""
echo "Web Serial needs localhost (or HTTPS). Press Ctrl+C to stop."
echo ""

if command -v http-server >/dev/null 2>&1; then
  exec http-server -p "$PORT" -a "$HOST" -c-1
fi

if command -v npx >/dev/null 2>&1; then
  exec npx --yes http-server -p "$PORT" -a "$HOST" -c-1
fi

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT" --bind "$HOST"
fi

echo "No server found. Install http-server (npm) or use python3." >&2
exit 1
