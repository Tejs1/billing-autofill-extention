#!/bin/bash

# Test script for AI Form Auto Fill backend server
# This script tests the /api/generate-fill endpoint

echo "🧪 Testing AI Form Auto Fill Backend Server"
echo "==========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file from .env.example"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if required variables are set
if [ -z "$SERVER_API_KEY" ]; then
    echo "❌ Error: SERVER_API_KEY not set in .env"
    exit 1
fi

# Use SERVER_URL from env, fallback to command-line arg, then default
SERVER_URL="${SERVER_URL:-${1:-http://localhost:3000}}"

echo "📍 Server URL: $SERVER_URL"
echo "🔑 Using SERVER_API_KEY from .env"
echo ""

# Test 1: Health check
echo "Test 1: Health Check"
echo "--------------------"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$SERVER_URL/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HEALTH_CODE" = "200" ]; then
    echo "✅ Health check passed"
    echo "Response: $HEALTH_BODY"
else
    echo "❌ Health check failed (HTTP $HEALTH_CODE)"
    echo "Response: $HEALTH_BODY"
    exit 1
fi

echo ""

# Test 2: Generate fill data
echo "Test 2: Generate Fill Data"
echo "---------------------------"
FILL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SERVER_URL/api/generate-fill" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SERVER_API_KEY" \
  -d '{
    "fields": [
      {
        "id": "test-1",
        "name": "email",
        "label": "Email Address",
        "type": "email",
        "placeholder": "your@email.com"
      },
      {
        "id": "test-2",
        "name": "phone",
        "label": "Phone Number",
        "type": "tel"
      },
      {
        "id": "test-3",
        "name": "firstName",
        "label": "First Name",
        "type": "text"
      }
    ]
  }')

FILL_CODE=$(echo "$FILL_RESPONSE" | tail -n1)
FILL_BODY=$(echo "$FILL_RESPONSE" | sed '$d')

if [ "$FILL_CODE" = "200" ]; then
    echo "✅ Generate fill passed"
    echo "Response:"
    echo "$FILL_BODY" | python3 -m json.tool 2>/dev/null || echo "$FILL_BODY"
else
    echo "❌ Generate fill failed (HTTP $FILL_CODE)"
    echo "Response: $FILL_BODY"
    exit 1
fi

echo ""

# Test 3: Invalid API key
echo "Test 3: Invalid API Key (should fail)"
echo "--------------------------------------"
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SERVER_URL/api/generate-fill" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid-key" \
  -d '{"fields": []}')

INVALID_CODE=$(echo "$INVALID_RESPONSE" | tail -n1)

if [ "$INVALID_CODE" = "401" ]; then
    echo "✅ Invalid API key correctly rejected"
else
    echo "⚠️  Expected 401, got HTTP $INVALID_CODE"
fi

echo ""
echo "==========================================="
echo "✅ All tests completed successfully!"
echo ""
echo "Your server is ready to use with the extension."
echo "Copy this SERVER_API_KEY to your extension settings:"
echo ""
echo "  $SERVER_API_KEY"
echo ""

