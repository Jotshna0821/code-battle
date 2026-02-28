# Fix CORS Error on EC2

## Problem
CORS error: "No 'Access-Control-Allow-Origin' header is present on the requested resource"

## Solution

### Step 1: Update Backend .env on EC2
Edit `backend/.env` and change:
```bash
FRONTEND_URL=http://3.239.212.18:8080
```

### Step 2: Rebuild Backend
```bash
cd backend
npm run build
```

### Step 3: Restart Backend Server
Stop the current backend process (Ctrl+C) and restart:
```bash
npm run dev
```

### Step 4: Verify
Check backend is running:
```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Step 5: Test from Browser
Open: http://3.239.212.18:8080/dashboard

The CORS error should be gone!

## What Changed
- Backend now reads `FRONTEND_URL` from .env
- CORS middleware allows requests from that URL
- Supports both localhost (development) and EC2 IP (production)

## Quick Commands for EC2

### Check if backend is running:
```powershell
netstat -ano | findstr :3001
```

### Check if frontend is running:
```powershell
netstat -ano | findstr :8080
```

### View backend logs:
Backend logs appear in the terminal where you ran `npm run dev`
