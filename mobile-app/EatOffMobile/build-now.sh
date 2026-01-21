#!/bin/bash

echo "🔧 EatOff Mobile App - Direct Build"
echo "Building APK with existing configuration..."

# Clear cache
rm -rf node_modules/.cache .expo 2>/dev/null || true

# Reinstall with overrides
rm -rf node_modules
npm install

# Build directly
echo "🏗️  Building APK..."
npx eas build --platform android --profile preview --non-interactive --wait

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 BUILD COMPLETED!"
    echo "📱 Download at: https://expo.dev/accounts/livioochertes/projects/eatoff-mobile/builds"
    echo "🔧 App is configured for: https://0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev"
    echo "🧪 Test with: demo@example.com / DemoPassword123!"
else
    echo "❌ Build failed"
fi