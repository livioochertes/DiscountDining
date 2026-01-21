#!/bin/bash

# Build EatOff APK without keystore
echo "Building EatOff APK without keystore..."

cd "$(dirname "$0")"

# Try local build first (no keystore required)
echo "Attempting local build..."
npx eas build --platform android --profile development --local --clear-cache

# If local fails, try development with non-interactive mode
if [ $? -ne 0 ]; then
    echo "Local build failed, trying cloud build with non-interactive mode..."
    echo "n" | npx eas build --platform android --profile development --clear-cache
fi

# If that fails, try preview without keystore
if [ $? -ne 0 ]; then
    echo "Development build failed, trying preview without keystore..."
    echo "n" | npx eas build --platform android --profile preview --clear-cache
fi

echo "Build completed. Check EAS dashboard for APK download."