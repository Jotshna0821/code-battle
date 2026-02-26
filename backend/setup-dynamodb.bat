@echo off
REM CodeBattle DynamoDB Setup Script for Windows
REM This script creates all required DynamoDB tables and seeds initial data

echo.
echo 🚀 CodeBattle DynamoDB Setup
echo ==============================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo ✅ Node.js found
node --version
echo.

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found!
    echo Please create backend\.env with your AWS credentials:
    echo.
    echo AWS_REGION=us-east-1
    echo AWS_ACCESS_KEY_ID=your_access_key
    echo AWS_SECRET_ACCESS_KEY=your_secret_key
    echo.
    exit /b 1
)

echo ✅ .env file found
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
echo.

REM Create Users table
echo 📝 Creating CodeBattleUsers table...
node create-users-dynamodb-table.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to create Users table
    exit /b 1
)
echo.

REM Create Questions table
echo 📝 Creating CodeBattleQuestions table...
node create-questions-dynamodb-table.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to create Questions table
    exit /b 1
)
echo.

REM Seed questions
echo 🌱 Seeding questions...
node seed-questions-dynamodb.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to seed questions
    exit /b 1
)
echo.

echo ✅ DynamoDB setup completed successfully!
echo.
echo Next steps:
echo 1. Start the backend: npm run dev
echo 2. Start the frontend: cd .. ^&^& npm run dev
echo 3. Open http://localhost:8080 in your browser
echo.
pause
