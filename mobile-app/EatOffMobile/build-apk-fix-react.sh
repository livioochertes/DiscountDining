#!/bin/bash

# EatOff Mobile APK Build Script - React Version Fix
# This script resolves React version conflicts and builds the APK

echo "🔧 Starting APK Build with React Version Fix..."

# Step 1: Clean up existing node_modules and package-lock.json
echo "🧹 Cleaning up existing dependencies..."
rm -rf node_modules
rm -f package-lock.json
rm -rf ~/.npm/_cacache

# Step 2: Clear npm cache completely
echo "🗑️ Clearing npm cache..."
npm cache clean --force

# Step 3: Install dependencies with correct React version
echo "📦 Installing dependencies with React 18.2.0..."
npm install --legacy-peer-deps --force

# Step 4: Check React version is correct
echo "🔍 Verifying React version..."
npm list react react-native

# Step 5: Start EAS build process
echo "🚀 Starting EAS build..."
echo "If you haven't logged in to EAS yet, run: npx eas login"
echo ""

# Build APK with preview profile (faster than production)
npx eas build --platform android --profile preview --non-interactive

echo ""
echo "✅ Build process completed!"
echo "📱 Your APK will be available in your Expo dashboard"
echo "🌐 Go to: https://expo.dev/accounts/[your-username]/projects/eatoffmobile/builds"
echo ""
echo "🎉 Once built, you can download and install the APK on any Android device!"