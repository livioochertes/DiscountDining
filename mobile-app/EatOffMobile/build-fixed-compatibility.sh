#!/bin/bash

# EatOff Mobile App - Build with Fixed ES Module Compatibility
# This script fixes the ora ES module error and builds the APK

set -e

echo "🔧 Building EatOff Mobile App with compatibility fixes..."

# Get current Replit domain
CURRENT_DOMAIN=$(echo $REPLIT_DOMAINS | head -1)
if [ -z "$CURRENT_DOMAIN" ]; then
    echo "⚠️  Warning: Could not detect Replit domain. Using fallback."
    CURRENT_DOMAIN="0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev"
fi

SERVER_URL="https://$CURRENT_DOMAIN"
API_URL="$SERVER_URL/api"

echo "📡 Configuring API endpoint: $API_URL"

# Update API configuration
sed -i "s|const API_BASE_URL = '.*';|const API_BASE_URL = '$API_URL';|g" src/services/api.ts

echo "✅ API configuration updated"

# Fix ES module compatibility issues
echo "🔧 Fixing ES module compatibility..."
npm install ora@5.4.1 --save-dev --force --silent

# Clear cache and reinstall
echo "🧹 Clearing cache and reinstalling dependencies..."
rm -rf node_modules/.cache .expo 2>/dev/null || true
npm install --silent

# Install specific compatible versions
echo "📦 Installing compatible package versions..."
npm install @expo/cli@0.17.8 --save-dev --force --silent

echo "✅ Compatibility fixes applied"

# Build for production
echo "🏗️  Building Android APK..."
echo "⏳ This may take 10-15 minutes. Please wait..."

npx eas build --platform android --profile preview --non-interactive --wait

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 BUILD COMPLETED SUCCESSFULLY!"
    echo ""
    echo "📱 Your EatOff Mobile App is ready!"
    echo "📥 Download your APK from: https://expo.dev/accounts/livioochertes/projects/eatoff-mobile/builds"
    echo ""
    echo "🔧 App Configuration:"
    echo "   • Server URL: $SERVER_URL"
    echo "   • API Endpoint: $API_URL"
    echo "   • Demo Credentials: demo@example.com / DemoPassword123!"
    echo ""
    echo "🧪 Testing Instructions:"
    echo "   1. Install the APK on your Android device"
    echo "   2. Open the app and tap 'Test Server Connection'"
    echo "   3. Login with demo credentials"
    echo "   4. Explore all features!"
    echo ""
    echo "✅ The mobile app is now ready for production use!"
else
    echo "❌ Build failed. Check error messages above."
    echo "💡 Common solutions:"
    echo "   • Clear cache: rm -rf node_modules .expo"
    echo "   • Reinstall: npm install"
    echo "   • Check internet connection"
fi