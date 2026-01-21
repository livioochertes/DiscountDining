#!/bin/bash

# EatOff Mobile APK Build Script
echo "Starting EatOff Mobile APK build..."

# Change to mobile app directory
cd "$(dirname "$0")"

# Install dependencies if needed
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Install EAS CLI if needed
echo "Installing EAS CLI..."
npm install -g @expo/eas-cli

# Login check
echo "Checking EAS login..."
npx eas whoami

# Try development build first (no keystore required)
echo "Building APK with development profile..."
npx eas build --platform android --profile development --clear-cache --non-interactive

# If development fails, try preview with auto-submit
if [ $? -ne 0 ]; then
    echo "Development build failed, trying preview with auto-submit..."
    npx eas build --platform android --profile preview --auto-submit --non-interactive
fi

# If that fails, try standard preview
if [ $? -ne 0 ]; then
    echo "Auto-submit failed, trying standard preview..."
    npx eas build --platform android --profile preview --clear-cache --non-interactive
fi

echo "Build process completed. Check EAS dashboard for results."
echo "Dashboard: https://expo.dev/accounts/livioochertes/projects/rest-express"