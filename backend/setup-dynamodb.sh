#!/bin/bash

# CodeBattle DynamoDB Setup Script
# This script creates all required DynamoDB tables and seeds initial data

echo "🚀 CodeBattle DynamoDB Setup"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create backend/.env with your AWS credentials:"
    echo ""
    echo "AWS_REGION=us-east-1"
    echo "AWS_ACCESS_KEY_ID=your_access_key"
    echo "AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo ""
    exit 1
fi

echo "✅ .env file found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Create Users table
echo "📝 Creating CodeBattleUsers table..."
node create-users-dynamodb-table.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to create Users table"
    exit 1
fi
echo ""

# Create Questions table
echo "📝 Creating CodeBattleQuestions table..."
node create-questions-dynamodb-table.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to create Questions table"
    exit 1
fi
echo ""

# Seed questions
echo "🌱 Seeding questions..."
node seed-questions-dynamodb.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to seed questions"
    exit 1
fi
echo ""

echo "✅ DynamoDB setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start the backend: npm run dev"
echo "2. Start the frontend: cd .. && npm run dev"
echo "3. Open http://localhost:8080 in your browser"
echo ""
