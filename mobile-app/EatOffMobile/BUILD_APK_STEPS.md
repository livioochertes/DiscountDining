# Build Your EatOff Android APK - Step by Step Guide

## Now that you have an Expo account, follow these exact steps:

### Step 1: Open Terminal/Command Prompt
```bash
cd mobile-app/EatOffMobile
```

### Step 2: Login to Expo
```bash
npx eas login
```
- Enter your Expo account email
- Enter your Expo account password
- Login will be confirmed

### Step 3: Build APK
```bash
npx eas build --platform android --profile preview
```

### Step 4: Wait for Build
- Build process will start automatically
- Takes about 5-10 minutes
- You'll see progress updates in terminal

### Step 5: Download APK
After build completes, you'll get:
- **Direct download link** in terminal
- **Build dashboard link** to: https://expo.dev/accounts/[your-username]/projects/eatoff-mobile/builds

### Step 6: Install APK
1. Download APK file to your computer
2. Transfer to Android device
3. Enable "Install from Unknown Sources" in Android settings
4. Install APK file
5. Open EatOff app

## What You'll Get

**APK File Details:**
- File size: ~30-50MB
- Compatible with: Android 5.0+ (API 21+)
- Bundle ID: com.eatoff.mobile
- Version: 1.0.0

**Complete App Features:**
- Restaurant discovery with search and filters
- Voucher purchasing and QR code system
- Menu browsing and cart functionality
- AI dining recommendations
- User profiles and loyalty points
- Order tracking and history

## Demo Account for Testing
- Email: demo@example.com
- Password: DemoPassword123!

## Troubleshooting

**If login fails:**
- Check your Expo account credentials
- Ensure you're using the correct email/password
- Try: `npx eas whoami` to verify login status

**If build fails:**
- Check internet connection
- Ensure mobile-app/EatOffMobile directory is correct
- Try running build command again

## Alternative: Instant Testing
While APK builds, you can test immediately:
```bash
npx expo start --tunnel
```
- Install Expo Go app on phone
- Scan QR code
- Test full app functionality

## Ready for App Stores
Your APK is also ready for:
- Google Play Store submission
- Beta testing distribution
- Enterprise deployment
- Internal company use

The mobile app includes all EatOff features with professional mobile UI and complete backend integration.