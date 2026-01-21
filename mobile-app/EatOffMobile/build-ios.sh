#!/bin/bash

# EatOff iOS App Build Script
echo "🍎 Building EatOff iOS App..."

# Change to mobile app directory
cd "$(dirname "$0")"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "⚠️  iOS builds require macOS. Use cloud build instead:"
    echo "   npx eas build --platform ios --profile production"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Install EAS CLI
echo "🔧 Installing EAS CLI..."
npm install -g @expo/eas-cli

# Login to EAS
echo "🔑 Logging into EAS..."
npx eas login

# Build iOS app
echo "🏗️  Building iOS app..."
npx eas build --platform ios --profile production --clear-cache

echo ""
echo "✅ iOS Build Process Complete!"
echo "=================================="
echo ""
echo "📱 Your EatOff iPhone app includes:"
echo "  ✓ Restaurant discovery & filtering"
echo "  ✓ Voucher purchasing & QR codes"
echo "  ✓ Menu ordering & cart functionality"
echo "  ✓ AI dining recommendations"
echo "  ✓ User profiles & loyalty points"
echo "  ✓ Real-time order tracking"
echo "  ✓ Native iOS performance"
echo ""
echo "🔐 Test credentials:"
echo "  Email: demo@example.com"
echo "  Password: DemoPassword123!"
echo ""
echo "📥 Download your IPA file from:"
echo "  https://expo.dev/accounts/livioochertes/projects/rest-express"
echo ""
echo "🎯 Next steps:"
echo "  1. Download the .ipa file when build completes"
echo "  2. Install on iPhone using Xcode or TestFlight"
echo "  3. Test all features thoroughly"
echo "  4. Submit to App Store when ready"
echo ""
echo "📚 For detailed instructions, see iOS_BUILD_GUIDE.md"