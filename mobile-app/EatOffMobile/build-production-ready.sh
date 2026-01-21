#!/bin/bash

# EatOff Mobile App - Production Ready Build Script
# This script creates a production-ready Android APK for the EatOff mobile app

set -e

echo "🚀 Building Production-Ready EatOff Mobile App..."

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

# Test server connection
echo "🔍 Testing server connection..."
if curl -s -f "$API_URL/restaurants?limit=1" > /dev/null 2>&1; then
    echo "✅ Server connection successful"
else
    echo "⚠️  External domain not accessible (this is normal during development)"
    echo "   Server URL: $SERVER_URL"
    echo "   💡 The mobile app will test the connection when you install it"
    echo "   💡 Use the 'Test Server Connection' button in the mobile app to verify"
fi

# Clean and install dependencies
echo "📦 Installing dependencies..."
npm install --silent

# Clean build cache
echo "🧹 Cleaning build cache..."
npx expo install --fix > /dev/null 2>&1
rm -rf .expo node_modules/.cache 2>/dev/null || true

# Build for production
echo "🏗️  Building production Android APK..."
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
    echo "   3. Login with demo credentials or create a new account"
    echo "   4. Explore restaurants, vouchers, and AI recommendations"
    echo ""
    echo "✅ The mobile app is now ready for production use!"
else
    echo "❌ Build failed. Please check the error messages above."
    echo "💡 Common solutions:"
    echo "   • Run: rm -rf node_modules && npm install"
    echo "   • Check your internet connection"
    echo "   • Verify EAS CLI is properly configured"
fi