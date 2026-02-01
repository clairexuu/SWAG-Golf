#!/bin/bash

# Development startup script for SWAG Concept Sketch Agent
# This script starts all three required services

echo "=================================================="
echo "SWAG Concept Sketch Agent - Development Startup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}Starting services...${NC}"
echo ""

# Get the project root directory (one level up from control/)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Start Python API server
echo -e "${GREEN}[1/4] Starting Python API Server (port 8000)...${NC}"
cd "$PROJECT_ROOT"
python -m uvicorn api.main:app --reload --port 8000 > /tmp/swag-python.log 2>&1 &
PYTHON_PID=$!
echo "      PID: $PYTHON_PID"
sleep 3

# Start Express API server
echo -e "${GREEN}[2/4] Starting Express API Server (port 3001)...${NC}"
cd "$SCRIPT_DIR/api"
npm run dev > /tmp/swag-api.log 2>&1 &
API_PID=$!
echo "      PID: $API_PID"
sleep 2

# Start Frontend dev server
echo -e "${GREEN}[3/4] Starting Frontend Dev Server (port 5173)...${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev > /tmp/swag-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "      PID: $FRONTEND_PID"
sleep 3

# Start Electron app
echo -e "${GREEN}[4/4] Starting Electron App...${NC}"
cd "$SCRIPT_DIR/electron"
npm run dev > /tmp/swag-electron.log 2>&1 &
ELECTRON_PID=$!
echo "      PID: $ELECTRON_PID"

echo ""
echo "=================================================="
echo -e "${GREEN}All services started!${NC}"
echo "=================================================="
echo ""
echo "Services running:"
echo "  - Python API:    http://localhost:8000 (PID: $PYTHON_PID)"
echo "  - Express API:   http://localhost:3001 (PID: $API_PID)"
echo "  - Frontend:      http://localhost:5173 (PID: $FRONTEND_PID)"
echo "  - Electron App:  Desktop application   (PID: $ELECTRON_PID)"
echo ""
echo "Log files:"
echo "  - Python:   /tmp/swag-python.log"
echo "  - API:      /tmp/swag-api.log"
echo "  - Frontend: /tmp/swag-frontend.log"
echo "  - Electron: /tmp/swag-electron.log"
echo ""
echo "To stop all services, run:"
echo "  kill $PYTHON_PID $API_PID $FRONTEND_PID $ELECTRON_PID"
echo ""
echo "Press Ctrl+C to exit (services will continue running)"
echo "=================================================="

# Save PIDs to a file for easy cleanup
echo "$PYTHON_PID" > /tmp/swag-pids.txt
echo "$API_PID" >> /tmp/swag-pids.txt
echo "$FRONTEND_PID" >> /tmp/swag-pids.txt
echo "$ELECTRON_PID" >> /tmp/swag-pids.txt

# Keep script running
wait
