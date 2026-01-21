#!/bin/bash

echo "🚀 Building EatOff Mobile APK - Simple Approach"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "❌ Error: app.json not found. Please run this script from the EatOffMobile directory."
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Generate Android project using expo prebuild
echo "🔧 Generating Android project..."
npx expo prebuild --platform android --clear

# Check if Android project was created
if [ ! -d "android" ]; then
    echo "❌ Error: Android project not generated. Trying alternative approach..."
    
    # Alternative: Use expo run to generate and build
    echo "🔄 Trying expo run:android..."
    npx expo run:android --no-install --no-bundler
    
    if [ ! -d "android" ]; then
        echo "❌ Failed to generate Android project. Please check your configuration."
        exit 1
    fi
fi

# Build the APK
echo "🏗️ Building APK..."
cd android

# Make gradlew executable
chmod +x gradlew

# Build release APK
./gradlew assembleRelease

# Check if APK was built successfully
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    echo "✅ APK built successfully!"
    echo "📍 APK location: android/$APK_PATH"
    
    # Copy APK to project root for easy access
    cp "$APK_PATH" "../eatoff-mobile.apk"
    echo "📋 APK copied to: eatoff-mobile.apk"
    
    # Show APK info
    echo "📊 APK Information:"
    ls -lh "../eatoff-mobile.apk"
else
    echo "❌ APK build failed. Check the logs above for errors."
    exit 1
fi

echo "🎉 Build completed successfully!"
echo "You can install the APK on your Android device: eatoff-mobile.apk"