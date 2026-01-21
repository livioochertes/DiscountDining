#!/bin/bash

echo "🔧 EatOff Mobile - Simple Build"

# Skip the full reinstall - try building directly
echo "🏗️  Building APK directly..."
timeout 1800 npx eas build --platform android --profile preview --non-interactive

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESS!"
    echo "📱 Download: https://expo.dev/accounts/livioochertes/projects/eatoff-mobile/builds"
elif [ $? -eq 124 ]; then
    echo "⏱️  Build timed out (30 minutes)"
    echo "💡 Check build status at: https://expo.dev/accounts/livioochertes/projects/eatoff-mobile/builds"
else
    echo "❌ Build failed"
fi