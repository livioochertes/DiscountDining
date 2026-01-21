#!/bin/bash

# Stable EatOff APK build
echo "Building EatOff APK with stable configuration..."

cd "$(dirname "$0")"

# Clean previous build artifacts
echo "Cleaning build artifacts..."
rm -rf node_modules
rm -rf .expo
rm -rf dist

# Install dependencies with legacy peer deps to handle conflicts
echo "Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

# Start build process
echo "Starting stable build process..."
echo "Keystore already exists, build should proceed automatically..."
echo ""

# Run build with development profile
npx eas build --platform android --profile development --clear-cache

echo ""
echo "Build completed. Download your APK from:"
echo "https://expo.dev/accounts/livioochertes/projects/rest-express"