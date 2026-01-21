#!/bin/bash

# Android APK Build Script - React Version Conflict Fix
echo "🚀 Building EatOff Android APK with React version conflict resolution..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf android/ ios/ node_modules/

# Create .npmrc to force React 18.2.0
echo "📝 Creating .npmrc with dependency resolution..."
cat > .npmrc << EOF
legacy-peer-deps=true
force=true
EOF

# Install dependencies with legacy peer deps
echo "📦 Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

# Verify Expo installation
echo "✅ Verifying Expo installation..."
npx expo --version

# Build Android APK with production profile
echo "🏗️ Building Android APK..."
npx eas build --platform android --profile production --non-interactive

echo "✅ Build complete! Check your Expo dashboard for the APK download."
echo "🔗 Dashboard: https://expo.dev/accounts/livioochertes/projects/rest-express"