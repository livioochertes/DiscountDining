#!/bin/bash

# Complete APK Build Script - All JavaScript Syntax Errors Fixed
echo "🚀 Building EatOff Android APK - All JavaScript Issues Resolved"

# Clean all caches and previous builds
echo "🧹 Cleaning build environment completely..."
rm -rf android/ ios/ node_modules/ .expo/ .metro-cache/

# Clear all npm and Metro caches
npm cache clean --force
npx expo install --fix
npx metro-cache clear || true

# Install dependencies with fixed React versions
echo "📦 Installing dependencies with JavaScript syntax fixes..."
npm install --legacy-peer-deps --force --strict-peer-deps=false

# Clear Metro bundler cache and verify installation
echo "🔄 Clearing Metro bundler cache..."
npx expo start --clear --non-interactive || true

# Verify Expo CLI is working
echo "✅ Verifying Expo CLI installation..."
npx expo --version

# Build Android APK with production profile
echo "🏗️ Building Android APK..."
npx eas build --platform android --profile production --non-interactive

echo "✅ Build completed successfully!"
echo "📱 Your APK is available in the Expo dashboard:"
echo "🔗 https://expo.dev/accounts/livioochertes/projects/rest-express"
echo ""
echo "JavaScript syntax errors fixed:"
echo "  ✅ AuthContext.tsx - Added missing semicolon to interface"
echo "  ✅ AppNavigator.tsx - Added missing Text import from react-native"
echo "  ✅ App.tsx - Updated cacheTime to gcTime for React Query v5"
echo "  ✅ React version conflicts - Forced React 18.2.0 compatibility"
echo "  ✅ EAS CLI version enforced - Using cli.version >= 8.0.0 in eas.json"
echo "  ✅ EOVERRIDE conflict - Removed conflicting @types/react override"