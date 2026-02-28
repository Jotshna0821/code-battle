# EC2 Quick Fix - CORS Error

## On Your EC2 Instance (RDP)

### 1. Update Backend .env
```bash
cd E:\projects\codestreak-challenge-1\backend
notepad .env
```

Change this line:
```
FRONTEND_URL=http://3.239.212.18:8080
```

Save and close.

### 2. Rebuild Backend
```bash
npm run build
```

### 3. Restart Backend
Stop current backend (Ctrl+C), then:
```bash
npm run dev
```

### 4. Test
Open browser: http://3.239.212.18:8080/dashboard

CORS error should be gone!

## What This Does
- Tells backend to allow requests from your EC2 frontend
- Fixes "No 'Access-Control-Allow-Origin' header" error
- Enables API calls between frontend and backend

## Verify It's Working
Backend terminal should show:
```
🚀 Server running on port 3001
📊 Environment: development
💾 Using DynamoDB for data storage
```

Browser console should NOT show CORS errors.
