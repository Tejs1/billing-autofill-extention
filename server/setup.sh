#!/bin/bash

# Setup script for AI Form Auto Fill backend server

echo "🚀 AI Form Auto Fill - Server Setup"
echo "===================================="
echo ""

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed!"
    echo ""
    echo "Please install Bun first:"
    echo "  curl -fsSL https://bun.sh/install | bash"
    echo ""
    exit 1
fi

echo "✅ Bun is installed: $(bun --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
bun install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    
    # Generate a secure random key
    SERVER_API_KEY=$(openssl rand -hex 32 2>/dev/null || echo "PLEASE-CHANGE-THIS-TO-A-SECURE-RANDOM-STRING")
    
    cat > .env << EOF
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server Authentication
# Generate a secure random string for this (e.g., using: openssl rand -hex 32)
SERVER_API_KEY=$SERVER_API_KEY

# Server Configuration
PORT=3000

# CORS Configuration (optional - comma-separated origins)
# For Chrome extensions, use: chrome-extension://YOUR_EXTENSION_ID
# For development, you can use: *
ALLOWED_ORIGINS=*
EOF
    
    echo "✅ Created .env file with auto-generated SERVER_API_KEY"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your OpenAI API key!"
    echo ""
    echo "Your SERVER_API_KEY has been set to:"
    echo "  $SERVER_API_KEY"
    echo ""
    echo "Copy this key - you'll need it for the browser extension settings."
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Summary
echo "===================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add your OPENAI_API_KEY"
echo "  2. Run: bun run dev"
echo "  3. Configure the browser extension with:"
echo "     - Server URL: http://localhost:3000"
echo "     - Server API Key: (from .env file)"
echo ""
echo "For more help, see README.md"
echo ""

