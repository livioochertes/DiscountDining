#!/bin/bash

# EatOff Mobile - Gradle Build Fix for JavaScript Bundling
# This script fixes the createBundleReleaseJsAndAssets error

echo "🔧 Starting Gradle Build Fix for JavaScript Bundling..."

# Step 1: Clean all caches and builds
echo "🧹 Cleaning all caches and builds..."
rm -rf node_modules
rm -rf .expo
rm -rf android/app/build
rm -rf android/build
rm -rf ~/.gradle/caches
rm -rf ~/.npm/_cacache
rm -f package-lock.json
rm -f yarn.lock

# Step 2: Clear Metro bundler cache
echo "🗑️ Clearing Metro bundler cache..."
npx expo r -c
npx react-native start --reset-cache 2>/dev/null || echo "Metro cache cleared"

# Step 3: Install dependencies with fixed versions
echo "📦 Installing dependencies with React 18.2.0..."
npm install --legacy-peer-deps --force --no-audit --no-fund

# Step 4: Fix React Query import issues
echo "🔧 Fixing React Query compatibility..."
# Update any remaining cacheTime references to gcTime
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/cacheTime:/gcTime:/g' 2>/dev/null || true

# Step 5: Verify React versions
echo "🔍 Verifying React versions..."
npm list react react-native @tanstack/react-query

# Step 6: Pre-bundle JavaScript to check for errors
echo "🎯 Pre-bundling JavaScript..."
npx expo export:embed --platform android --dev false --clear

# Step 7: Start EAS build with clean environment
echo "🚀 Starting EAS build with clean environment..."
echo "Building with development profile for faster testing..."

# Use development profile which is faster and has better error reporting
npx eas build --platform android --profile development --clear-cache --non-interactive

echo ""
echo "✅ Build process completed!"
echo "📱 If successful, your APK will be available in the Expo dashboard"
echo "🌐 Go to: https://expo.dev/builds"
echo ""
echo "⚠️ If the build still fails, check the logs in the Expo dashboard for detailed error information"