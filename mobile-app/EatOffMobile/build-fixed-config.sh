#!/bin/bash

# EatOff Mobile APK Build - Fixed Configuration
echo "Building EatOff Mobile APK with corrected configuration..."

# Change to mobile app directory
cd "$(dirname "$0")"

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Install EAS CLI
echo "Installing EAS CLI..."
npm install -g @expo/eas-cli

# Login to EAS
echo "Logging into EAS..."
npx eas login

# Clear cache and build with development profile
echo "Building APK with development profile..."
npx eas build --platform android --profile development --clear-cache

echo "Build completed! Check the EAS dashboard for your APK."
echo "Dashboard: https://expo.dev/accounts/livioochertes/projects/rest-express"