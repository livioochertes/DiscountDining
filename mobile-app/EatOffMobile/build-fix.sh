#!/bin/bash

echo "🔧 EatOff Mobile - Complete Build Fix"
echo "====================================="

# Navigate to mobile app directory
cd mobile-app/EatOffMobile

# Fix 1: Clean and update dependencies
echo "🧹 Cleaning and updating dependencies..."
rm -rf android/
rm -rf node_modules/
rm -rf .expo/
rm -rf .expo-shared/
rm -rf node_modules/.cache/
npm cache clean --force
yarn cache clean 2>/dev/null || true

# Fix 2: Install updated dependencies for Expo SDK 50
echo "📦 Installing Expo SDK 50 dependencies..."
npm install --legacy-peer-deps

# Fix 2.5: Update npm to avoid deprecated warnings
echo "📦 Updating npm to latest version..."
npm install -g npm@latest

# Fix 3: Fix dependencies using expo install
echo "🔧 Fixing dependencies with expo install..."
npx expo install --fix

# Fix 4: Run expo doctor to verify fixes
echo "🏥 Running expo doctor..."
npx expo doctor

# Fix 5: Clear EAS cache
echo "🗑️ Clearing EAS build cache..."
npx eas build:cancel --all --non-interactive 2>/dev/null || true

# Fix 6: Try multiple build approaches
echo "🚀 Starting build process..."

# Method 1: Preview build with remote credentials (most stable)
echo "📱 Attempting preview build with remote credentials..."
npx eas build --platform android --profile preview --non-interactive --clear-cache

if [ $? -eq 0 ]; then
    echo "✅ Preview build successful!"
    echo "📥 You can download the APK from the EAS build dashboard"
    echo "🔗 Visit: https://expo.dev/accounts/livioochertes/projects/rest-express/builds"
    exit 0
fi

# Method 2: Development build
echo "🔄 Trying development build..."
npx eas build --platform android --profile development --non-interactive --clear-cache

if [ $? -eq 0 ]; then
    echo "✅ Development build successful!"
    echo "📥 You can download the APK from the EAS build dashboard"
    exit 0
fi

# Method 3: Production build
echo "🔄 Trying production build..."
npx eas build --platform android --profile production --non-interactive --clear-cache

if [ $? -eq 0 ]; then
    echo "✅ Production build successful!"
    echo "📥 You can download the APK from the EAS build dashboard"
    exit 0
fi

echo "❌ All build methods failed. Checking common issues..."
echo ""
echo "🔍 Diagnosis:"
echo "   - Updated to Expo SDK 50 (supports Android API 34+)"
echo "   - Removed deprecated compileSdkVersion, targetSdkVersion, buildToolsVersion"
echo "   - Removed @types/react-native (included in react-native package)"
echo "   - Fixed Metro config to extend @expo/metro-config"
echo "   - Updated all dependencies to SDK 50 compatible versions"
echo ""
echo "💡 If build still fails, try:"
echo "   1. Check the EAS build logs for specific Gradle errors"
echo "   2. Verify your EAS credentials are valid"
echo "   3. Try: npx eas build --platform android --profile preview --local"
echo "   4. Contact EAS support if server issues persist"
echo ""
echo "🔗 EAS Build Dashboard: https://expo.dev/accounts/livioochertes/projects/rest-express/builds"
exit 1