#!/bin/bash

# Final EatOff APK build solution
echo "Building EatOff APK - Final approach..."

cd "$(dirname "$0")"

echo "Starting build with automatic keystore generation..."
echo "When prompted about keystore generation, answer 'y' (yes)"
echo ""

# Run the build command that will prompt for keystore generation
npx eas build --platform android --profile development --clear-cache

echo ""
echo "Build process completed."
echo "If successful, download your APK from:"
echo "Dashboard: https://expo.dev/accounts/livioochertes/projects/rest-express"
echo ""
echo "The APK will be available for download once the build finishes."