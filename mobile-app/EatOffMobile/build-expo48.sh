#!/bin/bash

# EatOff APK build with stable Expo 48 configuration (Pre-Kotlin issues)
echo "Building EatOff APK with stable Expo 48 configuration..."

cd "$(dirname "$0")"

# Clean all build artifacts
echo "Cleaning build artifacts..."
rm -rf node_modules
rm -rf .expo
rm -rf dist
rm -rf android
rm -rf ios

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Fix any peer dependency issues
echo "Fixing dependencies..."
npx expo install --fix

# Start build
echo "Starting build with Expo 48..."
npx eas build --platform android --profile development --clear-cache --non-interactive

echo ""
echo "Build completed. Check your EAS dashboard:"
echo "https://expo.dev/accounts/livioochertes/projects/rest-express/builds"
echo ""
echo "Expo 48 should resolve Kotlin compilation issues."