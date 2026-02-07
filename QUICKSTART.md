# Quick Start Guide

## One-Command Startup

### Start Application
```bash
./start.sh
```
or
```bash
npm start
```

### Stop Application
```bash
./stop.sh
```
or
```bash
npm run stop
```

## All Available Commands

### Startup
```bash
npm start           # Start both backend and frontend
npm run dev         # Same as npm start
./start.sh          # Direct script execution
```

### Stop
```bash
npm run stop        # Stop all servers
./stop.sh           # Direct script execution
```

### Installation & Setup
```bash
npm run install:all # Install all dependencies
npm run setup       # Full setup: install deps + Prisma migrations
```

### Individual Services
```bash
npm run backend     # Run only backend
npm run frontend    # Run only frontend
```

### Logs
```bash
npm run logs:backend   # Tail backend logs
npm run logs:frontend  # Tail frontend logs

# Or directly:
tail -f .logs/backend.log
tail -f .logs/frontend.log
```

## What the startup script does:

1. ✅ Checks if `.env` files exist
2. ✅ Installs dependencies if needed
3. ✅ Generates Prisma Client if needed
4. ✅ Kills any existing processes on ports 3000 & 5173
5. ✅ Starts backend server (port 3000)
6. ✅ Starts frontend server (port 5173)
7. ✅ Shows real-time logs
8. ✅ Press Ctrl+C to stop all servers

## First Time Setup

1. **Configure environment variables:**
   ```bash
   # Edit backend/.env with your credentials
   DATABASE_URL=postgresql://...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ANTHROPIC_API_KEY=...
   ```

2. **Run full setup:**
   ```bash
   npm run setup
   ```

3. **Start application:**
   ```bash
   npm start
   ```

4. **Open browser:**
   - Frontend: http://localhost:5173
   - Backend Health: http://localhost:3000/health

## Troubleshooting

### Ports already in use
The start script automatically kills existing processes on ports 3000 and 5173.

### Manual cleanup
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Check what's running
```bash
lsof -i:3000
lsof -i:5173
```

### View logs
```bash
tail -f .logs/backend.log
tail -f .logs/frontend.log
```

### Fresh install
```bash
rm -rf backend/node_modules frontend/node_modules
npm run install:all
```

## Configuration Requirements

Before starting, ensure you have:

- [ ] PostgreSQL database running
- [ ] `backend/.env` configured with real values
- [ ] Google OAuth credentials (for login)
- [ ] Anthropic API key (for AI features)

See [README.md](README.md) for detailed configuration instructions.
