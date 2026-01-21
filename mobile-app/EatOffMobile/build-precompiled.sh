#!/bin/bash

# Pre-compiled EatOff APK build using ejected workflow
echo "Building EatOff APK with pre-compiled approach..."

cd "$(dirname "$0")"

# Clean everything
echo "Cleaning build artifacts..."
rm -rf node_modules
rm -rf .expo
rm -rf dist
rm -rf android
rm -rf ios

# Install Expo CLI globally
echo "Installing Expo CLI..."
npm install -g expo-cli@latest

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Prebuild native code
echo "Prebuilding native Android code..."
npx expo prebuild --platform android --clean

# Build using local Android build
echo "Building APK locally..."
cd android
./gradlew assembleDebug

# Copy APK to main directory
echo "Copying APK..."
cp app/build/outputs/apk/debug/app-debug.apk ../eatoff-debug.apk

cd ..

echo ""
echo "Build completed!"
echo "APK file: eatoff-debug.apk"
echo "Size: $(du -h eatoff-debug.apk 2>/dev/null || echo 'File not found')"