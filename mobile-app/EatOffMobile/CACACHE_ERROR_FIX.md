# CaCache Error Fix - EatOff Mobile Build

## The Error You Encountered

```
TypeError [ERR_INVALID_ARG_TYPE]: The "original" argument must be of type function. Received an instance of Object
at Object.promisify (node:internal/util:343:3)
at Object.<anonymous> (/home/expo/workingdir/build/mobile-app/EatOffMobile/node_modules/cacache/lib/entry-index.js:18:21)
```

## Root Cause

This error occurs due to a Node.js version compatibility issue with the `cacache` package. The EAS build environment uses Node.js v18.18.0, but some dependencies have outdated `cacache` versions that aren't compatible.

## Complete Fix Applied

### 1. Package.json Updates

**Added `cacache` version override:**
```json
"resolutions": {
  "cacache": "^18.0.0"
},
"overrides": {
  "cacache": "^18.0.0"
}
```

**Added Node.js engine specification:**
```json
"engines": {
  "node": ">=18.0.0"
}
```

### 2. Build Process Improvements

**Enhanced cleaning process:**
- Removes `.expo-shared/` directory
- Cleans both npm and yarn caches
- Forces fresh dependency resolution

**Updated build scripts:**
- `build-fix.sh` - Complete build fix with cacache resolution
- `fix-cacache-error.sh` - Specific cacache error fix

### 3. Dependency Resolution Strategy

The fix forces npm to use:
- `cacache@18.0.0` (compatible with Node.js 18+)
- Modern Babel transform plugins
- Updated core dependencies

## How to Apply the Fix

### Option 1: Run the specific cacache fix
```bash
./mobile-app/EatOffMobile/fix-cacache-error.sh
```

### Option 2: Run the complete build fix
```bash
./mobile-app/EatOffMobile/build-fix.sh
```

### Option 3: Manual steps
```bash
cd mobile-app/EatOffMobile
rm -rf node_modules package-lock.json .expo .expo-shared
npm install
npx expo prebuild --no-install --platform android
```

## Expected Result

After applying the fix:
- ✅ No more cacache promisify errors
- ✅ prebuild command succeeds
- ✅ EAS build completes successfully
- ✅ Android APK builds without errors

## Build Command

Once the fix is applied, use:
```bash
eas build --platform android --profile preview --clear-cache
```

The `--clear-cache` flag ensures EAS doesn't use any cached dependencies that might contain the old cacache version.

## Why This Fix Works

1. **Forces modern cacache**: Overrides ensure all dependencies use cacache@18.0.0
2. **Node.js compatibility**: Ensures proper Node.js 18+ support
3. **Clean slate**: Removes all cached dependencies and builds
4. **Proper dependency resolution**: Uses npm (not yarn) to avoid package resolution conflicts

Your build should now complete successfully without the cacache error.