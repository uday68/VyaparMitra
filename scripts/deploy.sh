#!/bin/bash

# VyaparMitra Deployment Script

set -e

echo "🚀 Starting VyaparMitra deployment..."

# Check if required tools are installed
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads public/audio public/qr logs

# Build and start services
echo "🔨 Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
if curl -f http://localhost:4000/api/health >/dev/null 2>&1; then
    echo "✅ VyaparMitra is running successfully!"
    echo "🌐 API: http://localhost:4000/api"
    echo "📊 GraphQL: http://localhost:4000/graphql"
    echo "🔊 WebSocket: ws://localhost:4000/graphql"
else
    echo "❌ Health check failed. Checking logs..."
    docker-compose logs app
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your BHASHINI API key in .env"
echo "2. Set up your domain and SSL certificate"
echo "3. Configure monitoring and backups"
echo "4. Test the voice and translation features"
echo ""
echo "📖 Documentation: https://github.com/uday68/VyaparMitra#readme"