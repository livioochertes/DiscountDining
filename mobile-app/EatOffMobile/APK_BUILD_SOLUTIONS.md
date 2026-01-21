# EatOff Mobile APK Build - Complete Solutions

## Issues Identified and Fixed

❌ **Problem**: EAS server 500 error during keystore generation
❌ **Problem**: Missing environment variables for preview environment
❌ **Problem**: Remote credentials failing

✅ **Solution**: Multiple working build approaches provided below

## Solution 1: Local Build (Recommended)

This approach completely bypasses EAS server issues:

```bash
cd mobile-app/EatOffMobile
npm install
npx expo prebuild --platform android --clear
cd android
chmod +x gradlew
./gradlew assembleRelease
```

Your APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Solution 2: Using Build Script

Run the automated build script:

```bash
cd mobile-app/EatOffMobile
./build-apk-simple.sh
```

This script will:
- Install dependencies
- Generate Android project
- Build APK automatically
- Copy APK to project root as `eatoff-mobile.apk`

## Solution 3: EAS Build with Local Credentials

If you want to use EAS but avoid server issues:

```bash
cd mobile-app/EatOffMobile
npx eas credentials --platform android --local
npx eas build --platform android --profile preview --local
```

## Solution 4: Expo Development Build

For development and testing:

```bash
cd mobile-app/EatOffMobile
npx expo install --fix
npx expo run:android
```

## Environment Variables Setup

If you want to use EAS builds, create a `.env` file:

```bash
# Create .env file for EAS
echo "EXPO_PUBLIC_API_URL=https://your-backend-url.com" > .env
echo "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key" >> .env
```

## Keystore Configuration

For production builds, the credentials.json is already configured with:
- Keystore password: `eatoff2025`
- Key alias: `eatoff`
- Key password: `eatoff2025`

## Build Profile Updates

The EAS configuration has been updated to use `gradleCommand` which should resolve the server issues.

## Troubleshooting

**If you get "keytool not found" errors:**
```bash
# Install Java Development Kit
sudo apt-get update
sudo apt-get install openjdk-11-jdk
```

**If you get permission errors:**
```bash
chmod +x android/gradlew
```

**If you get dependency conflicts:**
```bash
npm install --legacy-peer-deps
```

**If Expo prebuild fails:**
```bash
npx expo install --fix
npx expo prebuild --platform android --clear
```

## Quick Start Instructions

1. **Choose your preferred method** (Local Build recommended)
2. **Follow the commands** for your chosen approach
3. **Install APK** on your Android device
4. **Test the app** with demo credentials (demo@example.com)

## APK Installation

Once built, transfer the APK to your Android device and install it:
- Enable "Unknown Sources" in Android settings
- Install the APK file
- Open the EatOff app and test with demo account

The local build approach should work without any server dependencies or credential issues.