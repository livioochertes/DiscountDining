#!/bin/bash

# EatOff Mobile App Build Script with Current Server Connection
# This script builds the mobile app with the current Replit server URL

echo "🔧 Building EatOff Mobile App with current server connection..."

# Get current Replit domain
REPLIT_DOMAIN=$(echo $REPLIT_DOMAINS | cut -d' ' -f1)
SERVER_URL="https://$REPLIT_DOMAIN"

echo "📡 Using server URL: $SERVER_URL"

# Update API configuration with current server URL
echo "📝 Updating API configuration..."
sed -i "s|const API_BASE_URL = '.*'|const API_BASE_URL = '$SERVER_URL/api'|g" src/services/api.ts

echo "📦 Installing dependencies..."
npm install

echo "🧹 Cleaning cache..."
npx expo install --fix
npm run clean 2>/dev/null || true

echo "🏗️ Building Android APK..."
# Build with current configuration
npx eas build --platform android --profile preview --non-interactive --wait

echo "✅ Build completed!"
echo "📱 Your APK is ready for download from: https://expo.dev/accounts/livioochertes/projects/eatoff-mobile/builds"
echo "🔗 The mobile app is configured to connect to: $SERVER_URL"
echo "🧪 Test the connection using the 'Test Server Connection' button in the login screen"