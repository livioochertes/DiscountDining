#!/bin/bash

# EatOff Mobile APK Build - Use Existing Credentials
echo "Building EatOff Mobile APK with existing credentials..."

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

# Initialize EAS project
echo "Initializing EAS project..."
npx eas init

# Check if credentials exist
echo "Checking for existing credentials..."
npx eas credentials

# Build APK with interactive mode (so we can select existing credentials)
echo "Building APK (will prompt for credential selection)..."
npx eas build --platform android --profile preview --clear-cache

echo "Build completed! Check the EAS dashboard for your APK download link."