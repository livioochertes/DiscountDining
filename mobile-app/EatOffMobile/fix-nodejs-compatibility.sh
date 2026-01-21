#!/bin/bash

echo "🔧 Fixing Node.js Compatibility Issues - EatOff Mobile"
echo "===================================================="

# Navigate to the correct directory
cd "$(dirname "$0")" || exit 1

echo "📍 Working in: $(pwd)"

# Clean everything thoroughly
echo "🧹 Cleaning all dependencies and cache..."
rm -rf node_modules/
rm -rf package-lock.json
rm -rf yarn.lock
rm -rf .expo/
rm -rf .expo-shared/
rm -rf .expo-src/
rm -rf android/
rm -rf ios/

# Clean all caches
echo "🧹 Cleaning all caches..."
npm cache clean --force 2>/dev/null || true
yarn cache clean 2>/dev/null || true
npx expo cache clear 2>/dev/null || true

# Install dependencies with npm (better Node.js compatibility)
echo "📦 Installing dependencies with npm..."
npm install --verbose

# Fix any peer dependencies
echo "🔧 Fixing peer dependencies..."
npx expo install --fix

# Update Expo CLI to latest
echo "📦 Updating Expo CLI..."
npm install -g @expo/cli@latest

# Test prebuild to ensure compatibility
echo "🔨 Testing prebuild compatibility..."
npx expo prebuild --no-install --platform android

echo "✅ Node.js compatibility fixes complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Run: eas build --platform android --profile preview --clear-cache"
echo "   2. The build should now complete successfully"
echo ""
echo "📋 If you still encounter issues:"
echo "   - Check Node.js version: node --version (should be 18+)"
echo "   - Run this script again"
echo "   - Contact support with specific error messages"