#!/bin/bash

# EatOff APK build with stable Expo 49 configuration (Kotlin compatibility)
echo "Building EatOff APK with stable Expo 49 configuration..."

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

# Initialize and prebuild
echo "Initializing Expo project..."
npx expo install --fix

# Clear cache and build
echo "Starting build with Expo 49..."
npx eas build --platform android --profile development --clear-cache --non-interactive

echo ""
echo "Build completed. Check your EAS dashboard:"
echo "https://expo.dev/accounts/livioochertes/projects/rest-express/builds"