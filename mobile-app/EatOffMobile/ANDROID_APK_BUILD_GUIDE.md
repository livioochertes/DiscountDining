# Android APK Build Guide - EatOff Mobile App

## Current Status
Your React Native mobile app is 100% ready for Android APK generation with these configurations:
- **Package Name**: com.livioochertes.restexpress
- **App Name**: EatOff
- **Version**: 1.0.0
- **Build Profiles**: Development, Preview, Production
- **Expo Project ID**: 9c95bc63-78aa-424d-ac44-3d6d573ce426

## Method 1: Web Interface Build (Recommended)

### Step 1: Access Expo Dashboard
1. Go to https://expo.dev/accounts/livioochertes/projects/rest-express
2. Sign in with your Expo account
3. Navigate to the "Builds" section

### Step 2: Start New Build
1. Click "Create a build"
2. Select "Android" platform
3. Choose "Production" profile
4. Click "Start Build"

### Step 3: Download APK
1. Wait for build completion (10-15 minutes)
2. Download the APK file when ready
3. Install on Android device or emulator

## Method 2: Command Line Build

### Prerequisites
- Expo CLI installed and authenticated
- EXPO_TOKEN environment variable set (✅ Already configured)

### Build Commands
```bash
# Navigate to mobile app directory
cd mobile-app/EatOffMobile

# Build production APK
npx eas build --platform android --profile production

# Build development APK (faster)
npx eas build --platform android --profile development

# Build with specific options
npx eas build --platform android --profile production --clear-cache
```

## Method 3: Local Build

### Requirements
- Android SDK installed
- Android Studio configured
- Node.js and npm/yarn

### Steps
```bash
# Navigate to mobile app directory
cd mobile-app/EatOffMobile

# Build locally
npx eas build --platform android --profile development --local

# Alternative: Use Expo CLI
npx expo run:android
```

## Build Profiles Configuration

### Development Profile
- **Build Type**: APK
- **Distribution**: Internal
- **Credentials**: Remote
- **Dev Client**: Disabled

### Preview Profile
- **Build Type**: APK
- **Distribution**: Internal
- **Credentials**: Remote

### Production Profile
- **Build Type**: APK
- **Credentials**: Remote
- **App Store Ready**: Yes

## App Configuration Details

### Android Permissions
- Internet access
- Network state access
- Location services (fine and coarse)
- Camera access for QR codes

### App Features
- ✅ Restaurant discovery and browsing
- ✅ Voucher management and QR codes
- ✅ Menu ordering and cart system
- ✅ AI dietary recommendations
- ✅ User authentication and profiles
- ✅ Loyalty points system
- ✅ Real-time order tracking

### Backend Integration
- **Server URL**: Automatically configured for current Replit server
- **API Endpoints**: All EatOff backend APIs integrated
- **Authentication**: JWT token-based authentication
- **Demo Credentials**: demo@example.com / DemoPassword123!

## Troubleshooting

### If Build Fails
1. **Check Expo Account**: Ensure you're logged in to expo.dev
2. **Verify Token**: Check EXPO_TOKEN environment variable
3. **Clear Cache**: Use `--clear-cache` flag
4. **Try Different Profile**: Use development instead of production

### If CLI Times Out
1. **Use Web Interface**: Build via expo.dev dashboard
2. **Update CLI**: Run `npm install -g eas-cli`
3. **Check Internet**: Ensure stable connection

### Common Issues
- **Authentication**: Ensure EXPO_TOKEN is set correctly
- **Project ID**: Verify project exists in your Expo account
- **Package Name**: Ensure com.livioochertes.restexpress is unique

## Expected Build Time
- **Development**: 5-10 minutes
- **Production**: 10-15 minutes
- **With Cache**: 3-5 minutes

## Next Steps After Build

### Testing
1. **Download APK** from Expo dashboard
2. **Install on Device** or emulator
3. **Test Core Features**:
   - Login with demo credentials
   - Browse restaurants
   - View vouchers
   - Place test orders

### Deployment
1. **Google Play Console**: Upload APK for store release
2. **Internal Testing**: Share APK with team/users
3. **Beta Testing**: Use Google Play Internal Testing

## Direct Links
- **Expo Dashboard**: https://expo.dev/accounts/livioochertes/projects/rest-express
- **Build History**: https://expo.dev/accounts/livioochertes/projects/rest-express/builds
- **Project Settings**: https://expo.dev/accounts/livioochertes/projects/rest-express/settings

## Support Commands
```bash
# Check authentication
npx eas whoami

# View build history
npx eas build:list

# Cancel active build
npx eas build:cancel

# View project info
npx eas project:info
```

Your Android APK is ready to be built using any of these methods. The web interface method is most reliable for immediate results.