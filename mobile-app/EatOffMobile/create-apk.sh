#!/bin/bash

echo "🔨 Creating EatOff Android APK without Expo account..."

# Create build directory
mkdir -p dist

# Check if we have the required tools
if ! command -v npx &> /dev/null; then
    echo "❌ Node.js and npm are required"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --silent

echo "🏗️ Setting up Android build environment..."

# Create Android project structure
npx expo prebuild --platform android --no-install

if [ $? -eq 0 ]; then
    echo "✅ Android project created successfully"
    
    # Build APK using Gradle
    echo "🔧 Building APK..."
    cd android
    
    # Make gradlew executable
    chmod +x gradlew
    
    # Build release APK
    ./gradlew assembleRelease
    
    if [ $? -eq 0 ]; then
        echo "✅ APK built successfully!"
        
        # Copy APK to dist folder
        cp app/build/outputs/apk/release/app-release.apk ../dist/eatoff-mobile.apk
        
        echo "📱 APK Location: mobile-app/EatOffMobile/dist/eatoff-mobile.apk"
        echo "📊 APK Size: $(du -h ../dist/eatoff-mobile.apk | cut -f1)"
        echo "🎯 Ready for installation on Android devices"
        
        # Create installation instructions
        cat > ../dist/INSTALL_INSTRUCTIONS.txt << EOF
EatOff Mobile APK Installation Instructions

1. Transfer eatoff-mobile.apk to your Android device
2. Enable "Install from Unknown Sources" in Android settings
3. Tap the APK file to install
4. Open EatOff app after installation

Demo Account:
Email: demo@example.com
Password: DemoPassword123!

Features:
- Restaurant discovery and filtering
- Voucher purchasing and QR codes
- Menu ordering with shopping cart
- AI dining recommendations
- User profiles and loyalty points

Technical Details:
- Compatible with Android 5.0+ (API 21+)
- Bundle ID: com.eatoff.mobile
- Version: 1.0.0
EOF
        
        echo "📋 Installation instructions created: dist/INSTALL_INSTRUCTIONS.txt"
        
    else
        echo "❌ APK build failed"
        exit 1
    fi
else
    echo "❌ Failed to create Android project"
    echo "💡 Alternative: Try 'npx expo start' for immediate testing"
    exit 1
fi