#!/bin/bash

# Meshtastic-Convex Bridge Setup Script
echo "🚀 Setting up Meshtastic-Convex Bridge Service..."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Install root dependencies
echo "📦 Installing service dependencies..."
npm install
echo ""

# Setup Convex
echo "📦 Installing Convex dependencies..."
cd convex
npm install
echo ""

# Create .env if it doesn't exist
cd ..
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and set your CONVEX_URL"
    echo "   You can get this from your Convex dashboard at https://dashboard.convex.dev"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Deploy Convex schema
echo "🔧 Ready to deploy Convex schema..."
echo ""
echo "Next steps:"
echo "1. Edit .env and add your CONVEX_URL"
echo "2. Deploy Convex schema: cd convex && npx convex dev"
echo "3. Run the service: npm run dev"
echo ""
echo "For production deployment, see README.md"
echo ""
echo "✅ Setup complete!"
