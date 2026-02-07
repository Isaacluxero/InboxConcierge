#!/bin/bash

# Inbox Concierge Startup Script
# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Inbox Concierge Startup${NC}"
echo -e "${BLUE}================================${NC}\n"

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found${NC}"
    echo -e "${YELLOW}Please create backend/.env from backend/.env.example${NC}"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Creating frontend/.env...${NC}"
    echo "VITE_API_URL=http://localhost:3000" > frontend/.env
fi

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Check if Prisma Client is generated
if [ ! -d "backend/node_modules/.prisma" ]; then
    echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
    cd backend && npx prisma generate && cd ..
fi

echo -e "\n${GREEN}✅ All checks passed!${NC}\n"

# Kill any existing processes on ports 3000 and 5173
echo -e "${YELLOW}🔍 Checking for existing processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✅ Killed process on port 3000${NC}" || echo -e "${BLUE}ℹ️  Port 3000 is free${NC}"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✅ Killed process on port 5173${NC}" || echo -e "${BLUE}ℹ️  Port 5173 is free${NC}"

echo -e "\n${GREEN}🚀 Starting servers...${NC}\n"

# Create log directory
mkdir -p .logs

# Start backend
echo -e "${BLUE}🔹 Starting Backend (port 3000)...${NC}"
cd backend
npm run dev > ../.logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
echo -e "${BLUE}🔹 Starting Frontend (port 5173)...${NC}"
cd frontend
npm run dev > ../.logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for servers to fully start
sleep 3

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✅ Application Started!${NC}"
echo -e "${GREEN}================================${NC}\n"

echo -e "${BLUE}📍 URLs:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:3000${NC}"
echo -e "   Health:   ${GREEN}http://localhost:3000/health${NC}\n"

echo -e "${BLUE}📋 Process IDs:${NC}"
echo -e "   Backend:  ${BACKEND_PID}"
echo -e "   Frontend: ${FRONTEND_PID}\n"

echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   Backend:  .logs/backend.log"
echo -e "   Frontend: .logs/frontend.log\n"

echo -e "${YELLOW}💡 Useful Commands:${NC}"
echo -e "   View backend logs:  ${GREEN}tail -f .logs/backend.log${NC}"
echo -e "   View frontend logs: ${GREEN}tail -f .logs/frontend.log${NC}"
echo -e "   Stop all:           ${GREEN}./stop.sh${NC}\n"

# Save PIDs to file for stop script
echo "$BACKEND_PID" > .logs/backend.pid
echo "$FRONTEND_PID" > .logs/frontend.pid

echo -e "${GREEN}🎉 Ready to use! Open http://localhost:5173 in your browser${NC}\n"

# Keep script running and show combined logs
trap "echo -e '\n${YELLOW}Stopping servers...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}\n"
echo -e "${BLUE}================================${NC}\n"

# Tail both logs
tail -f .logs/backend.log .logs/frontend.log
