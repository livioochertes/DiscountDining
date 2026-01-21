#!/bin/bash

# Clean EatOff APK build
echo "Building EatOff APK with clean dependencies..."

cd "$(dirname "$0")"

# Remove existing node_modules to ensure clean build
echo "Cleaning dependencies..."
rm -rf node_modules

# Install dependencies with exact versions
echo "Installing dependencies..."
npm install

# Start clean build
echo "Starting clean build process..."
echo "When prompted about keystore generation, answer 'y' (yes)"
echo ""

# Run build with development profile
npx eas build --platform android --profile development --clear-cache

echo ""
echo "Build completed. Check your EAS dashboard:"
echo "https://expo.dev/accounts/livioochertes/projects/rest-express"