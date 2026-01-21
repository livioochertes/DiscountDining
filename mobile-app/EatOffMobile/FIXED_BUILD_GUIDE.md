# EatOff Mobile - Fixed APK Build Guide

## Issues Fixed

✅ **Fixed "cli.appVersionSource" error** - Added `"appVersionSource": "local"` to eas.json
✅ **Fixed expo-router plugin error** - Removed unused expo-router plugin from app.json
✅ **Fixed entry point issues** - Set proper main entry point in package.json
✅ **Fixed configuration errors** - Cleaned up app.json configuration
✅ **Added babel configuration** - Created proper babel.config.js

## Build Prerequisites

Before building, you need to install the mobile app dependencies:

```bash
cd mobile-app/EatOffMobile
npm install
```

## Build Options

### Option 1: EAS Build (Recommended)

1. **Create EAS Project** (if not already done):
   ```bash
   npx eas init
   ```

2. **Build APK for Preview**:
   ```bash
   npx eas build --platform android --profile preview
   ```

3. **Build APK for Production**:
   ```bash
   npx eas build --platform android --profile production
   ```

### Option 2: Local Build

1. **Install EAS CLI globally**:
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Build locally**:
   ```bash
   npx eas build --platform android --local
   ```

### Option 3: Expo Development Build

1. **Install Expo CLI**:
   ```bash
   npm install -g @expo/cli
   ```

2. **Run development build**:
   ```bash
   npx expo run:android
   ```

## Fixed Configuration Files

### eas.json (Updated)
```json
{
  "cli": {
    "version": ">= 8.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### app.json (Cleaned up)
- Removed problematic expo-router plugin
- Cleaned up unnecessary configurations
- Set proper bundle identifiers

### babel.config.js (Added)
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

## Troubleshooting

**If you get dependency errors:**
```bash
npx expo install --fix
```

**If you get version conflicts:**
```bash
npm install expo@~53.0.17
```

**If EAS is not configured:**
```bash
npx eas init
```

## APK Location

After successful build, your APK will be:
- **EAS Build**: Downloaded from build dashboard
- **Local Build**: In the project directory
- **Expo Run**: In `android/app/build/outputs/apk/`

## Next Steps

1. Install dependencies: `npm install`
2. Choose your preferred build method above
3. Follow the commands for your chosen method
4. Download your APK when build completes

The configuration issues have been resolved. The main problems were:
- Missing appVersionSource configuration
- Unused expo-router plugin causing conflicts
- Improper entry point configuration
- Missing babel configuration

All these issues are now fixed and the app should build successfully.