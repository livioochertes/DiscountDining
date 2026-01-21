#!/bin/bash

echo "🔧 Fixing Node.js Compatibility Issue for EatOff Mobile Build"
echo "============================================================"

# Navigate to the correct directory
cd "$(dirname "$0")" || exit 1

# Clean everything first
echo "🧹 Cleaning all cache and dependencies..."
rm -rf node_modules/
rm -rf package-lock.json
rm -rf yarn.lock
rm -rf .expo/
rm -rf .expo-shared/

# Clean npm and yarn caches
echo "🧹 Cleaning npm and yarn caches..."
npm cache clean --force 2>/dev/null || true
yarn cache clean 2>/dev/null || true

# Install dependencies with npm (not yarn) to avoid cacache issues
echo "📦 Installing dependencies with npm..."
npm install

# Run expo install to fix peer dependencies
echo "🔧 Running expo install to fix peer dependencies..."
npx expo install --fix

# Pre-build to check for issues
echo "🔨 Running prebuild to test compatibility..."
npx expo prebuild --no-install --platform android

echo "✅ Build compatibility fix complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Run: eas build --platform android --profile preview --clear-cache"
echo "   2. The build should now succeed without cacache errors"
echo ""
echo "📝 If you still get errors, run this script again or contact support."