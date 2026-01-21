#!/bin/bash

# Simple APK Build - No Development Client Required
echo "Building EatOff Mobile APK (Standard Build)..."

# Change to mobile app directory
cd "$(dirname "$0")"

# Clear any existing build cache
echo "Clearing build cache..."
npx eas build:cancel 2>/dev/null || true

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Install EAS CLI if not already installed
echo "Installing EAS CLI..."
npm install -g @expo/eas-cli

# Login to EAS
echo "Logging into EAS..."
npx eas login

# Initialize EAS project
echo "Initializing EAS project..."
npx eas init

# Build APK using preview profile (standard APK)
echo "Building APK..."
npx eas build --platform android --profile preview --clear-cache --non-interactive

echo "Build completed! Check the EAS dashboard for your APK download link."
echo "APK will be available at: https://expo.dev/accounts/[your-username]/projects/eatoff-mobile/builds"