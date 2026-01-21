#!/bin/bash

echo "🔧 Installing Clean Dependencies for EatOff Mobile"
echo "=================================================="

# Navigate to the correct directory
cd "$(dirname "$0")" || exit 1

echo "📍 Current directory: $(pwd)"

# Remove old dependencies
echo "🧹 Cleaning old dependencies..."
rm -rf node_modules/
rm -rf package-lock.json
rm -rf yarn.lock

# Install dependencies with npm
echo "📦 Installing dependencies..."
npm install

# Fix any peer dependency issues
echo "🔧 Fixing peer dependencies..."
npx expo install --fix

# Run expo doctor to check for issues
echo "🏥 Running expo doctor..."
npx expo doctor

echo "✅ Installation complete!"
echo ""
echo "🎉 Next steps:"
echo "   - Run: npx expo start"
echo "   - Or build with: eas build --platform android --profile preview"