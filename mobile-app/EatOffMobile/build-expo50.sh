#!/bin/bash

# EatOff APK build with stable Expo 50 configuration
echo "Building EatOff APK with stable Expo 50 configuration..."

cd "$(dirname "$0")"

# Clean all build artifacts
echo "Cleaning build artifacts..."
rm -rf node_modules
rm -rf .expo
rm -rf dist

# Install dependencies with legacy peer deps
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Verify Expo version
echo "Verifying Expo configuration..."
npx expo --version

# Clear EAS cache and run build
echo "Starting build with cleared cache..."
npx eas build --platform android --profile development --clear-cache --non-interactive

echo ""
echo "Build completed. Check your EAS dashboard:"
echo "https://expo.dev/accounts/livioochertes/projects/rest-express/builds"
echo ""
echo "If successful, download your APK from the build page."