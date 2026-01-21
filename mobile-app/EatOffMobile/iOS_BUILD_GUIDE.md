# EatOff iOS App Build Guide

## Overview
Your EatOff iOS app is fully configured and ready to build. The app includes all the features from your web platform optimized for iPhone and iPad.

## iOS App Features
- **Restaurant Discovery**: Browse and filter restaurants
- **Voucher Management**: Purchase and redeem vouchers with QR codes
- **Menu Ordering**: Full shopping cart and checkout experience
- **AI Recommendations**: Personalized dining suggestions
- **User Profiles**: Account management and loyalty points
- **Real-time Updates**: Live order tracking and notifications

## Prerequisites
- **macOS Computer**: Required for iOS development
- **Xcode**: Latest version from Mac App Store
- **Apple Developer Account**: $99/year for App Store deployment
- **Expo CLI**: Already configured in your project

## Build Methods

### Method 1: Cloud Build (Recommended)
Build your iOS app using Expo's cloud service:

```bash
cd mobile-app/EatOffMobile
npx expo install --fix
npx eas build --platform ios --profile production
```

### Method 2: Local Development Build
For testing on your iPhone:

```bash
cd mobile-app/EatOffMobile
npx expo run:ios
```

### Method 3: Simulator Build
Test in iOS Simulator:

```bash
cd mobile-app/EatOffMobile
npx expo run:ios --simulator
```

## Current iOS Configuration

### App Information
- **Bundle ID**: `com.livioochertes.restexpress`
- **App Name**: EatOff
- **Version**: 1.0.0
- **Supports**: iPhone and iPad
- **iOS Version**: 13.0+ compatible

### Permissions Configured
- **Location Services**: Find nearby restaurants
- **Camera Access**: QR code scanning
- **Network Access**: API communication
- **Microphone**: Voice search features

### App Icons & Assets
- **App Icon**: `assets/icon.png` (1024x1024)
- **Splash Screen**: `assets/splash-icon.png`
- **Adaptive Icon**: Configured with orange background
- **Brand Colors**: Orange (#ff6b35) primary theme

## Step-by-Step iOS Build Process

### Step 1: Prepare Environment
```bash
# Navigate to mobile app directory
cd mobile-app/EatOffMobile

# Install dependencies
npm install --legacy-peer-deps

# Install/update Expo CLI
npm install -g @expo/eas-cli

# Login to Expo
npx eas login
```

### Step 2: Build for iOS
```bash
# Build production iOS app
npx eas build --platform ios --profile production --clear-cache

# Or build for development/testing
npx eas build --platform ios --profile development --clear-cache
```

### Step 3: Download and Test
1. Check build status at: https://expo.dev/accounts/livioochertes/projects/rest-express
2. Download the `.ipa` file when build completes
3. Install on iPhone using Xcode or TestFlight

### Step 4: App Store Deployment
1. **Create App Store Connect record**
2. **Upload IPA file** using Xcode or Application Loader
3. **Submit for review** with proper metadata
4. **Wait for approval** (typically 1-7 days)

## Testing Your iOS App

### Test Credentials
- **Email**: demo@example.com
- **Password**: DemoPassword123!

### Key Features to Test
1. **Restaurant Browsing**: Search and filter restaurants
2. **Voucher Purchasing**: Complete purchase flow
3. **QR Code Display**: Voucher redemption codes
4. **Menu Ordering**: Add items to cart and checkout
5. **AI Recommendations**: Personalized suggestions
6. **Profile Management**: Account settings and preferences

## App Store Metadata

### App Description
```
EatOff - Your Smart Dining Companion

Discover amazing restaurants, save money with voucher packages, and enjoy personalized dining experiences powered by AI.

Key Features:
• Browse restaurants with advanced filtering
• Purchase discounted meal vouchers
• Order food directly from restaurant menus
• Get AI-powered dining recommendations
• Manage loyalty points and rewards
• Scan QR codes for voucher redemption

Perfect for food lovers who want to save money while discovering new dining experiences.
```

### Keywords
```
restaurant, dining, food, vouchers, discounts, AI recommendations, loyalty points, QR codes
```

### App Store Categories
- **Primary**: Food & Drink
- **Secondary**: Lifestyle

## Technical Architecture

### Frontend Framework
- **React Native**: Native iOS performance
- **Expo**: Streamlined development and deployment
- **TypeScript**: Type-safe development
- **React Navigation**: Native navigation patterns

### Backend Integration
- **API Compatibility**: Uses your existing EatOff APIs
- **Real-time Data**: Live restaurant and order updates
- **Authentication**: Secure user sessions
- **Payment Processing**: Integrated Stripe payments

### Performance Optimizations
- **Image Caching**: Fast restaurant photo loading
- **Offline Support**: Cart persistence without internet
- **Memory Management**: Efficient data handling
- **Touch Interactions**: Optimized for mobile gestures

## Troubleshooting

### Common Issues
1. **Build Failures**: Clear cache with `--clear-cache` flag
2. **Credential Issues**: Use `npx eas credentials` to manage
3. **Simulator Issues**: Try `npx expo run:ios --simulator`
4. **Network Errors**: Check your internet connection

### Debug Commands
```bash
# Check project status
npx expo doctor

# Clear all caches
npx expo r -c

# View build logs
npx eas build:list

# Test on device
npx expo run:ios --device
```

## Next Steps After Build

1. **Test thoroughly** on multiple iOS devices
2. **Gather feedback** from beta testers
3. **Create App Store screenshots** and metadata
4. **Submit to App Store** for review
5. **Monitor performance** and user reviews

## App Store Submission Checklist

- [ ] App builds successfully
- [ ] All features work on iPhone and iPad
- [ ] App follows Apple's Human Interface Guidelines
- [ ] Privacy policy and terms of service included
- [ ] App Store screenshots prepared (6.7", 6.5", 5.5")
- [ ] App description and keywords optimized
- [ ] Apple Developer Program enrollment complete
- [ ] App Store Connect record created

## Support

Your iOS app is production-ready and includes:
- Complete feature parity with web app
- Native iOS performance and UI
- Proper App Store configurations
- Comprehensive testing capabilities

The app will connect to your existing EatOff backend automatically - no server changes needed!

## Resources

- **Expo Documentation**: https://docs.expo.dev/
- **Apple Developer**: https://developer.apple.com/
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **TestFlight**: https://developer.apple.com/testflight/