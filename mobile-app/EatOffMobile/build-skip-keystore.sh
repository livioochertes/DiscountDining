#!/bin/bash

# EatOff Mobile APK Build - Skip Keystore Issues
echo "Building EatOff Mobile APK (Skip Keystore Generation)..."

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

# Try to use existing keystore or skip keystore generation
echo "Building APK (attempting to use existing keystore)..."

# Method 1: Try to build without keystore prompts
npx eas build --platform android --profile preview --clear-cache --non-interactive --skip-credentials-check

# If that fails, try development profile
if [ $? -ne 0 ]; then
    echo "Trying development profile..."
    npx eas build --platform android --profile development --clear-cache --non-interactive
fi

echo "Build attempt completed. Check EAS dashboard for results."
echo "APK will be available at: https://expo.dev/accounts/[your-username]/projects/eatoff-mobile/builds"