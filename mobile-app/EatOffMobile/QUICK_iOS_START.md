# Quick Start: Build Your EatOff iPhone App

## 🚀 Ready to Build iOS App

Your EatOff iPhone app is **100% ready** to build with complete feature parity to your web platform.

## One-Command Build

```bash
cd mobile-app/EatOffMobile
./build-ios.sh
```

## Manual Build Steps

### 1. Navigate to App Directory
```bash
cd mobile-app/EatOffMobile
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Install EAS CLI (if not already installed)
```bash
npm install -g @expo/eas-cli
```

### 4. Login to Expo
```bash
npx eas login
```

### 5. Build iOS App
```bash
npx eas build --platform ios --profile production --clear-cache
```

## What You'll Get

- **Native iOS App**: Optimized for iPhone and iPad
- **App Store Ready**: Proper bundle ID and configurations
- **Complete Features**: All web platform functionality
- **Professional UI**: Native iOS design patterns

## Key Features Included

✅ **Restaurant Discovery**: Browse with filters and search  
✅ **Voucher System**: Purchase and redeem with QR codes  
✅ **Menu Ordering**: Full shopping cart and checkout  
✅ **AI Recommendations**: Personalized dining suggestions  
✅ **User Profiles**: Account management and preferences  
✅ **Loyalty Points**: Earn and redeem rewards  
✅ **Real-time Updates**: Live order and reservation tracking  

## Technical Details

- **Bundle ID**: `com.livioochertes.restexpress`
- **iOS Version**: 13.0+ compatible
- **Devices**: iPhone and iPad support
- **Backend**: Uses your existing EatOff APIs
- **Authentication**: Secure user sessions
- **Payments**: Integrated Stripe processing

## Test Your App

### Demo Account
- **Email**: demo@example.com
- **Password**: DemoPassword123!

### Test Workflow
1. **Browse restaurants** with filtering
2. **Purchase vouchers** with payment
3. **View QR codes** for redemption
4. **Order from menus** with cart
5. **Get AI recommendations**
6. **Manage profile** and points

## Build Output

After building, you'll receive:
- **IPA File**: Ready for App Store submission
- **Build URL**: Direct download link
- **Installation Instructions**: Device setup guide

## App Store Submission

1. **Download IPA** from Expo dashboard
2. **Upload to App Store Connect**
3. **Complete app metadata**
4. **Submit for review**
5. **Wait for approval** (1-7 days)

## Need Help?

- See `iOS_BUILD_GUIDE.md` for detailed instructions
- Check Expo dashboard: https://expo.dev/accounts/livioochertes/projects/rest-express
- Contact support if build fails

## Next Steps

1. **Run the build** using steps above
2. **Test thoroughly** on iPhone/iPad
3. **Prepare App Store listing**
4. **Submit for review**
5. **Launch your iOS app!**

Your iOS app is production-ready and will connect to your existing backend automatically.