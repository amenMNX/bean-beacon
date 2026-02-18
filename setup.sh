#!/bin/bash

# Bean Beacon - Development Setup Script
# This script sets up both frontend and backend for local development

set -e

echo "🚀 Bean Beacon - Development Setup"
echo "===================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✓ Node.js $(node -v) detected"
echo

# Setup Frontend
echo "📱 Setting up Frontend..."
cd bean-beacon-app-main

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo "✓ Frontend dependencies already installed"
fi

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env if your backend runs on a different port"
fi

echo "✓ Frontend setup complete"
echo

# Setup Backend
echo "🔧 Setting up Backend..."
cd ../bean-beacon-backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo "✓ Backend dependencies already installed"
fi

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your MongoDB URI and JWT secret"
fi

echo "✓ Backend setup complete"
echo

echo "════════════════════════════════════════"
echo "✅ Setup complete!"
echo "════════════════════════════════════════"
echo
echo "📝 Next steps:"
echo
echo "1. Update backend .env with MongoDB settings:"
echo "   cd bean-beacon-backend"
echo "   # Edit .env with your MONGODB_URI"
echo
echo "2. Start the backend (in one terminal):"
echo "   cd bean-beacon-backend"
echo "   npm run dev"
echo
echo "3. Start the frontend (in another terminal):"
echo "   cd bean-beacon-app-main"
echo "   npm run dev"
echo
echo "4. Open http://localhost:5173 in your browser"
echo
echo "ℹ️  Backend: http://localhost:3000"
echo "ℹ️  Frontend: http://localhost:5173"
echo
