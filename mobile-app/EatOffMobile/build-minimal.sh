#!/bin/bash

# Minimal EatOff APK build to avoid Kotlin compilation issues
echo "Building EatOff APK with minimal configuration..."

cd "$(dirname "$0")"

# Backup current files
cp app.json app-backup.json
cp eas.json eas-backup.json

# Use minimal configurations
cp app-minimal.json app.json
cp eas-minimal.json eas.json

# Clean everything
echo "Cleaning build artifacts..."
rm -rf node_modules
rm -rf .expo
rm -rf dist
rm -rf android
rm -rf ios

# Install minimal dependencies
echo "Installing minimal dependencies..."
npm install --legacy-peer-deps

# Build with minimal config
echo "Starting minimal build..."
npx eas build --platform android --profile development --clear-cache --non-interactive

# Restore original files
cp app-backup.json app.json
cp eas-backup.json eas.json
rm app-backup.json eas-backup.json

echo ""
echo "Minimal build completed. Check EAS dashboard:"
echo "https://expo.dev/accounts/livioochertes/projects/rest-express/builds"