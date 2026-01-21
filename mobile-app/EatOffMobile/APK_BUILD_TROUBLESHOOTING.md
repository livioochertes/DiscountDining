# APK Build Troubleshooting Guide

## Current Issues & Solutions

### 1. Dependency Version Conflicts
**Issue**: React Native version conflicts with React versions
**Solution**: Updated package.json with compatible versions (Expo 52, React Native 0.75, React 18.2)

### 2. Missing Dependencies
**Issue**: All dependencies show as "UNMET DEPENDENCY"
**Solution**: Run installation with legacy peer deps:
```bash
cd mobile-app/EatOffMobile
npm install --legacy-peer-deps
```

### 3. EAS Configuration Issues
**Issue**: Build fails due to configuration errors
**Solution**: Verified eas.json and app.json are properly configured

## Step-by-Step Build Process

### Method 1: EAS Build (Recommended)

1. **Navigate to mobile app directory**:
   ```bash
   cd mobile-app/EatOffMobile
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Install EAS CLI globally**:
   ```bash
   npm install -g @expo/eas-cli
   ```

4. **Login to Expo**:
   ```bash
   npx eas login
   ```

5. **Initialize EAS project**:
   ```bash
   npx eas init
   ```

6. **Build APK**:
   ```bash
   npx eas build --platform android --profile preview
   ```

### Method 2: Using Build Script

1. **Make build script executable**:
   ```bash
   chmod +x mobile-app/EatOffMobile/build-simple.sh
   ```

2. **Run build script**:
   ```bash
   ./mobile-app/EatOffMobile/build-simple.sh
   ```

## Common Error Messages & Fixes

### Error: "ERESOLVE unable to resolve dependency tree"
**Fix**: Use `--legacy-peer-deps` flag:
```bash
npm install --legacy-peer-deps
```

### Error: "cli.appVersionSource is not a valid property"
**Fix**: Already fixed in eas.json with `"appVersionSource": "local"`

### Error: "No EAS project found"
**Fix**: Initialize EAS project:
```bash
npx eas init
```

### Error: "Authentication failed"
**Fix**: Login to EAS:
```bash
npx eas login
```

### Error: "Build failed with gradle errors"
**Fix**: Update EAS CLI:
```bash
npm install -g @expo/eas-cli@latest
```

## Expected Output

### Successful Build Output:
```
✅ Build completed successfully
📱 APK download link: https://expo.dev/accounts/[username]/projects/eatoff-mobile/builds/[build-id]
```

### Build Time:
- Preview build: 5-10 minutes
- Production build: 10-15 minutes

## Verification Steps

1. **Check dependencies are installed**:
   ```bash
   npm list --depth=0
   ```

2. **Verify EAS configuration**:
   ```bash
   npx eas build:configure
   ```

3. **Test local development**:
   ```bash
   npx expo start
   ```

## Environment Variables (Optional)

Set these for production builds:
```bash
npx eas secret:create --name API_BASE_URL --value "https://your-backend-url.com"
npx eas secret:create --name STRIPE_PUBLISHABLE_KEY --value "pk_test_your_stripe_key"
```

## File Structure Check

Ensure these files exist:
- ✅ `app.json` - Expo configuration
- ✅ `eas.json` - EAS build configuration  
- ✅ `package.json` - Dependencies
- ✅ `babel.config.js` - Babel configuration
- ✅ `metro.config.js` - Metro bundler configuration
- ✅ `assets/` - App icons and splash screens

## Next Steps After Build

1. **Download APK**: Use the link provided after successful build
2. **Install on Android**: Enable "Unknown sources" in device settings
3. **Test functionality**: Login, browse restaurants, make purchases
4. **Debug if needed**: Check console logs for any runtime errors

## Support

If you continue to have issues:
1. Check the EAS build logs for specific error messages
2. Verify all configuration files match the examples above
3. Ensure you have proper Expo account access
4. Try building with different profiles (development, preview, production)

## Success Indicators

✅ Dependencies install without errors
✅ EAS login successful
✅ EAS init completes
✅ Build starts and shows progress
✅ Build completes with APK download link
✅ APK installs and runs on Android device