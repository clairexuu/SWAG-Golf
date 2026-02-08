#!/bin/bash

# Stop all SWAG development services

echo "Stopping SWAG Concept Sketch Agent services..."

if [ -f /tmp/swag-pids.txt ]; then
    while IFS= read -r pid; do
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "Killing process $pid"
            kill "$pid" 2>/dev/null || true
        fi
    done < /tmp/swag-pids.txt
    rm /tmp/swag-pids.txt
    echo "All services stopped."
else
    echo "No PID file found. Services may not be running."
    echo "Trying to kill processes by port..."

    # Try to kill by port
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true

    echo "Done."
fi

# Clean up log files
rm -f /tmp/swag-*.log
echo "Log files cleaned up."
