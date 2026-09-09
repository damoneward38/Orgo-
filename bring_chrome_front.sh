#!/usr/bin/env bash
# ---------------------------------------------------------------
# Bring Chrome (google‑chrome‑stable) to the foreground.
# If the browser is not running, start it.
#
# Dependencies:
#   - `xdotool`   (sudo apt install xdotool)
#   - `pgrep`
# ---------------------------------------------------------------

set -euo pipefail          # Fail fast on unset vars / errors

CHROME_CMD="google-chrome-stable"

# Find the first Chrome process by full command line, if any
CHROME_PID=$(pgrep -f "$CHROME_CMD" | head -n1 || true)

if [ -z "$CHROME_PID" ]; then
    # No Chrome running – start it.
    echo "Chrome not running – launching $CHROME_CMD"
    "$CHROME_CMD" &
else
    # Chrome is running – bring its window to the front.
    # Get the window id belonging to the first matching process.
    WIN_ID=$(xdotool search --pid "$CHROME_PID" | head -n1 || true)

    if [ -n "$WIN_ID" ]; then
        echo "Activating Chrome window (pid $CHROME_PID, win $WIN_ID)"
        xdotool windowactivate "$WIN_ID"
    else
        echo "Could not find a window for Chrome – only background process."
    fi
fi
