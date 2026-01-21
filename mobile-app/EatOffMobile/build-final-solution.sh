#!/bin/bash

# Final EatOff Mobile APK Build Solution
echo "🚀 Building EatOff Mobile APK - Final Solution"

# Change to mobile app directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Install EAS CLI
echo "📦 Installing EAS CLI..."
npm install -g @expo/eas-cli

# Login to EAS
echo "🔐 Logging into EAS..."
npx eas login

# Use the existing EAS project
echo "🔧 Using existing EAS project..."
echo "Project ID: 9c95bc63-78aa-424d-ac44-3d6d573ce426"

# Clear any existing build
echo "🧹 Clearing previous builds..."
npx eas build:cancel 2>/dev/null || true

# Try building with development profile first (no keystore required)
echo "🏗️ Attempting build with development profile..."
npx eas build --platform android --profile development --clear-cache

# If development fails, try with auto-submit
if [ $? -ne 0 ]; then
    echo "🔄 Trying with auto-submit..."
    npx eas build --platform android --profile preview --auto-submit
fi

# If still failing, try local build
if [ $? -ne 0 ]; then
    echo "🔄 Trying local build..."
    npx eas build --platform android --local
fi

echo "✅ Build process completed!"
echo "📱 Check your EAS dashboard: https://expo.dev/accounts/livioochertes/projects/rest-express"