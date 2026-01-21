#!/bin/bash

# Android APK Build Script - Direct and Simple
echo "🏗️  Building Android APK for EatOff..."

# Set timeout for command
timeout 600 npx eas build --platform android --profile production --non-interactive --clear-cache

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📱 Download your APK from: https://expo.dev/accounts/livioochertes/projects/rest-express/builds"
else
    echo "❌ Build failed or timed out"
    echo "🔄 Trying with development profile..."
    timeout 600 npx eas build --platform android --profile development --non-interactive
fi