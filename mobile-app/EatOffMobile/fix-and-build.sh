#!/bin/bash

echo "🔧 EatOff Mobile App - Fix and Build"
echo "Fixing ES module compatibility and building APK..."

# Step 1: Clear problematic cache
echo "🧹 Clearing cache..."
rm -rf node_modules/.cache .expo 2>/dev/null || true

# Step 2: Force install compatible ora version
echo "📦 Installing compatible ora version..."
npm install --save-dev ora@5.4.1

# Step 3: Build APK
echo "🏗️  Building APK..."
npx eas build --platform android --profile preview --non-interactive

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESSFUL!"
    echo "📱 Download your APK at: https://expo.dev/accounts/livioochertes/projects/eatoff-mobile/builds"
else
    echo "❌ Build failed"
    echo "💡 Try clearing cache and reinstalling: rm -rf node_modules && npm install"
fi