#!/bin/bash

# VyaparMitra Installation Script

set -e

echo "🚀 Installing VyaparMitra dependencies..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Install development dependencies
echo "📦 Installing development dependencies..."
npm install --save-dev

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads public/audio public/qr logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
fi

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

echo "✅ Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your database credentials"
echo "2. Set up PostgreSQL, MongoDB, and Redis"
echo "3. Configure BHASHINI API key for translations"
echo "4. Run 'npm run dev' to start development server"
echo ""
echo "📖 See README.md for detailed setup instructions"