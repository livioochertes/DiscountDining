# APK Build Solution - No expo-dev-client Required

## Issue Fixed
The error "Can't install expo-dev-client" occurs because `developmentClient: true` was set in the EAS configuration, which requires expo-dev-client to be installed. This is unnecessary for standard APK builds.

## Solution Applied
✅ **Removed `developmentClient: true`** from eas.json
✅ **Updated development profile** to build standard APK without dev client
✅ **Created simplified build script** that avoids dev client entirely

## Updated Build Options

### Option 1: Use Simple APK Build Script
```bash
./mobile-app/EatOffMobile/build-simple-apk.sh
```

### Option 2: Manual Commands
```bash
cd mobile-app/EatOffMobile

# Install dependencies
npm install --legacy-peer-deps

# Build standard APK (no dev client required)
npx eas build --platform android --profile preview --clear-cache --non-interactive
```

### Option 3: Try Development Profile (now fixed)
```bash
cd mobile-app/EatOffMobile
npx eas build --platform android --profile development --clear-cache
```

## Why This Works
- **No expo-dev-client dependency**: Removed `developmentClient: true` from config
- **Standard APK build**: Uses regular Expo build process
- **No additional packages**: Works with existing dependencies
- **Faster build**: No development client compilation needed

## Current EAS Configuration
```json
{
  "cli": {
    "version": ">= 8.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

## Expected Success
- ✅ No expo-dev-client installation required
- ✅ Standard APK build process
- ✅ Works with existing dependencies
- ✅ Produces installable APK file
- ✅ All app features functional

## Next Steps
1. Run the simple APK build script
2. Wait for build completion (5-10 minutes)
3. Download APK from provided link
4. Install on Android device
5. Test all app features

The build should now work without any expo-dev-client issues!