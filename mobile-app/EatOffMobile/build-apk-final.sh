#!/bin/bash

# Complete APK Build Script - JavaScript Bundling Fix
echo "🚀 Building EatOff Android APK - JavaScript Bundling Fix Applied"

# Clean all previous builds and caches
echo "🧹 Cleaning build environment..."
rm -rf android/ ios/ node_modules/ .expo/

# Clear npm cache
npm cache clean --force

# Install dependencies with React version fix
echo "📦 Installing dependencies with React version compatibility..."
npm install --legacy-peer-deps

# Clear Metro bundler cache
echo "🗑️ Clearing Metro bundler cache..."
npx expo start --clear

# Build Android APK
echo "🏗️ Building Android APK with production profile..."
npx eas build --platform android --profile production --non-interactive

echo "✅ Build process completed!"
echo "📱 Your APK will be available in the Expo dashboard:"
echo "🔗 https://expo.dev/accounts/livioochertes/projects/rest-express"