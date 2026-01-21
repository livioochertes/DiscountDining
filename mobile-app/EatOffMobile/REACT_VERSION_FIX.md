# React Version Conflict Fix for APK Build

## Problem
The EAS build is failing with this error:
```
ERR! Could not resolve dependency:
npm ERR! peer react@"18.2.0" from react-native@0.73.6
```

## Root Cause
React Native 0.73.6 requires exactly React 18.2.0, but the build process might be trying to use React 18.3.1 from the main project.

## Solution

### Quick Fix Commands:
```bash
cd mobile-app/EatOffMobile
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --force
npx eas build --platform android --profile preview
```

### Or use the automated script:
```bash
cd mobile-app/EatOffMobile
./build-apk-fix-react.sh
```

## What's Been Fixed:

1. **package.json**: Added specific React version overrides and peer dependencies
2. **.npmrc**: Enhanced with additional npm configuration to handle conflicts
3. **Build script**: Created automated script that cleans dependencies and rebuilds

## Configuration Details:

### package.json additions:
```json
{
  "overrides": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@types/react": "18.2.79"
  },
  "resolutions": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@types/react": "18.2.79"
  },
  "peerDependencies": {
    "react": "18.2.0"
  }
}
```

### .npmrc configuration:
```
legacy-peer-deps=true
force=true
strict-peer-deps=false
auto-install-peers=false
prefer-offline=false
audit=false
fund=false
save-exact=true
```

## Alternative Build Commands:

If the main EAS build still fails, try these alternatives:

### Local Build:
```bash
cd mobile-app/EatOffMobile
npx eas build --platform android --local
```

### Development Build:
```bash
cd mobile-app/EatOffMobile
npx expo run:android
```

### Expo Go Testing (No APK needed):
```bash
cd mobile-app/EatOffMobile
npx expo start
```

## Expected Result:
After using these fixes, the APK build should complete successfully and you'll get a download link for the APK file.

## Notes:
- The React version conflict is common when mixing React Native with other React projects
- The overrides and resolutions force npm to use the correct React version
- The --legacy-peer-deps flag allows npm to proceed despite peer dependency warnings