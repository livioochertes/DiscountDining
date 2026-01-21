#!/bin/bash

# EatOff Android App Build Script
# This script builds the native Android app for the EatOff platform

echo "🍽️ EatOff Android App Build Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -d "android-app/EatOffAndroid" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to Android project directory
cd android-app/EatOffAndroid

# Check if gradlew exists
if [ ! -f "./gradlew" ]; then
    echo "❌ Error: gradlew not found. Make sure you're in the Android project directory"
    exit 1
fi

# Make gradlew executable
chmod +x ./gradlew

echo "📱 Building EatOff Android App..."
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build debug APK
echo "🔨 Building debug APK..."
./gradlew assembleDebug

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📦 APK Location:"
    echo "   Debug APK: app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Install APK on Android device:"
    echo "      adb install app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "   2. Or copy APK to device and install manually"
    echo ""
    echo "   3. Demo credentials:"
    echo "      Email: demo@example.com"
    echo "      Password: DemoPassword123!"
    echo ""
    echo "🎉 EatOff Android App is ready!"
else
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "🔍 Common solutions:"
    echo "   1. Check Android SDK is installed"
    echo "   2. Verify Java 8+ is available"
    echo "   3. Run './gradlew --version' to check setup"
    echo "   4. Check Android Studio is properly configured"
    echo ""
    exit 1
fi

# Optional: Build release APK
read -p "📦 Build release APK? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Building release APK..."
    ./gradlew assembleRelease
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Release build successful!"
        echo "📦 Release APK: app/build/outputs/apk/release/app-release-unsigned.apk"
        echo ""
        echo "⚠️  Note: Release APK needs to be signed for production use"
    else
        echo "❌ Release build failed!"
    fi
fi

echo ""
echo "🚀 Build process complete!"
echo ""
echo "📱 App Features:"
echo "   • Restaurant discovery and filtering"
echo "   • Voucher package management"
echo "   • Menu browsing and ordering"
echo "   • QR code voucher system"
echo "   • User authentication and profiles"
echo "   • Real-time order tracking"
echo ""
echo "🔧 Technical Details:"
echo "   • Native Android Java app"
echo "   • Material Design 3 UI"
echo "   • Retrofit API integration"
echo "   • Connects to EatOff backend"
echo "   • Supports Android 7.0+ (API 24+)"
echo ""
echo "📞 Support: Use demo credentials and test connection button"
echo "🎯 Ready for deployment to Google Play Store!"