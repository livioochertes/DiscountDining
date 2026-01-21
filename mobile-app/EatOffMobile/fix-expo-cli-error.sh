#!/bin/bash

# Fix Expo CLI ES Module Error
# This script resolves the ERR_REQUIRE_ESM error with ora package

echo "🔧 Fixing Expo CLI ES Module compatibility error..."

# Force downgrade ora to CommonJS compatible version
echo "📦 Downgrading ora package to fix ES module conflict..."
npm install ora@5.4.1 --save-dev --force

# Clear node_modules and reinstall with fixed versions
echo "🧹 Clearing node_modules and reinstalling..."
rm -rf node_modules
npm install

# Install specific compatible versions of problematic packages
echo "📦 Installing compatible package versions..."
npm install @expo/cli@0.17.8 --save-dev --force

echo "✅ ES Module compatibility fix completed!"
echo "💡 You can now run the build command again"