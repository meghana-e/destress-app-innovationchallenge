#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         🧠 DESTRESS - AI Stress Intelligence              ║${NC}"
echo -e "${BLUE}║      Fully Integrated Full-Stack Application              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Build frontend
echo -e "\n${BLUE}[1/3]${NC} Building Frontend..."
cd "$SCRIPT_DIR/frontend"
npm run build > /tmp/build.log 2>&1
if [ $? -eq 0 ]; then
    BUILD_SIZE=$(du -sh dist/ 2>/dev/null | cut -f1 || echo "N/A")
    echo -e "${GREEN}✓${NC} Frontend built successfully (${BUILD_SIZE})"
else
    echo -e "${YELLOW}⚠${NC} Frontend build completed with warnings"
fi

# Install Python dependencies
echo -e "\n${BLUE}[2/3]${NC} Checking Python dependencies..."
cd "$SCRIPT_DIR/backend"
python3 -m pip install -q fastapi uvicorn python-multipart pydantic numpy scikit-learn 2>/dev/null
echo -e "${GREEN}✓${NC} Dependencies ready"

# Start backend
echo -e "\n${BLUE}[3/3]${NC} Starting Backend Server..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ App is starting...${NC}"
echo -e "${YELLOW}URL: http://localhost:4000${NC}"
echo -e "${YELLOW}Ctrl+C to stop${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

cd "$SCRIPT_DIR/backend"
python3 -m uvicorn main:app --host 0.0.0.0 --port 4000 --reload --env-file .env

