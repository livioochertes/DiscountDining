#!/bin/bash

# Local EatOff APK build using expo run:android
echo "Building EatOff APK locally to avoid EAS Kotlin issues..."

cd "$(dirname "$0")"

# Clean everything
echo "Cleaning build artifacts..."
rm -rf node_modules
rm -rf .expo
rm -rf dist
rm -rf android
rm -rf ios

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Install local build requirements
echo "Installing local build tools..."
npm install -g @expo/cli

# Prebuild for local development
echo "Prebuilding for local Android development..."
npx expo prebuild --platform android --clean

# Check if Android SDK is available
if [ ! -d "$ANDROID_HOME" ]; then
    echo "Android SDK not found. Setting up basic environment..."
    export ANDROID_HOME=$HOME/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/emulator
    export PATH=$PATH:$ANDROID_HOME/tools
    export PATH=$PATH:$ANDROID_HOME/tools/bin
    export PATH=$PATH:$ANDROID_HOME/platform-tools
fi

# Build APK locally
echo "Building APK locally..."
npx expo run:android --variant debug

# Find and copy the APK
echo "Locating generated APK..."
find . -name "*.apk" -type f -exec cp {} ./eatoff-local.apk \; 2>/dev/null || echo "APK not found, check android/app/build/outputs/apk/"

echo ""
echo "Local build completed!"
echo "Check for APK in: android/app/build/outputs/apk/debug/"
echo "Or copied as: eatoff-local.apk"