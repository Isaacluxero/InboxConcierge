#!/bin/bash

# Inbox Concierge Stop Script
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping Inbox Concierge...${NC}\n"

# Kill by PID if files exist
if [ -f ".logs/backend.pid" ]; then
    BACKEND_PID=$(cat .logs/backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo -e "${GREEN}✅ Stopped backend (PID: $BACKEND_PID)${NC}" || echo -e "${RED}❌ Backend not running${NC}"
    rm .logs/backend.pid
fi

if [ -f ".logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat .logs/frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✅ Stopped frontend (PID: $FRONTEND_PID)${NC}" || echo -e "${RED}❌ Frontend not running${NC}"
    rm .logs/frontend.pid
fi

# Also kill by port (backup method)
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✅ Killed any process on port 3000${NC}"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✅ Killed any process on port 5173${NC}"

echo -e "\n${GREEN}✅ All servers stopped!${NC}\n"
