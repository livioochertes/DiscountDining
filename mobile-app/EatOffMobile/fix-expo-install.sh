#!/bin/bash

# Fix Expo Installation and Build APK
echo "🔧 Installing missing Expo SDK and building APK..."

# Install Expo SDK with legacy peer deps to avoid version conflicts
npm install expo@~50.0.17 --legacy-peer-deps

# Verify installation
echo "✅ Expo SDK installed, verifying..."
npx expo --version

# Build Android APK
echo "🏗️ Building Android APK..."
npx eas build --platform android --profile production --non-interactive

echo "✅ Build complete! Check your Expo dashboard for the APK download link."