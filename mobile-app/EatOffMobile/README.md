# EatOff Mobile App - React Native

Complete mobile application for EatOff restaurant discovery and food ordering platform.

## Features

### Core Functionality
- 🏪 **Restaurant Discovery** - Browse and filter restaurants by cuisine, location, price range
- 👤 **User Authentication** - Register, login, and manage user profiles
- 🎫 **Voucher System** - Purchase, manage, and redeem restaurant vouchers with QR codes
- 🛒 **Menu Ordering** - Add items to cart and place orders directly from restaurant menus
- 💳 **Payment Integration** - Secure payments with Stripe and loyalty points redemption
- ⭐ **Points & Rewards** - Earn and redeem loyalty points across purchases
- 🤖 **AI Recommendations** - Personalized dining suggestions based on dietary preferences
- 📱 **Native UI** - Touch-friendly interface optimized for mobile devices

### Technical Architecture
- **Framework**: React Native with Expo 49
- **Navigation**: React Navigation v7 with tab and stack navigation
- **State Management**: React Context + TanStack Query for server state
- **Storage**: AsyncStorage for authentication tokens and user data
- **API Integration**: Complete REST API client connecting to EatOff backend
- **Authentication**: JWT token-based authentication with session management

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Expo CLI: `npm install -g @expo/cli`
- EAS CLI: `npm install -g eas-cli`
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone and Setup**
   ```bash
   cd mobile-app/EatOffMobile
   npm install --legacy-peer-deps
   ```

2. **Configure EAS Build**
   ```bash
   eas login
   eas build:configure
   ```

3. **Build APK (Android)**
   ```bash
   # Quick build
   ./build-working.sh
   
   # Or manual build
   npx eas build --platform android --profile development
   ```

### Demo Credentials
- **Email**: demo@example.com
- **Password**: DemoPassword123!

## Build Scripts

### Production Build (`build-working.sh`)
Complete production build with all features:
- Cleans previous builds
- Installs dependencies
- Configures API connection
- Builds production APK
- Includes all app features

### Development Build
```bash
npx expo start
```

### Test Build
```bash
npx eas build --platform android --profile preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React Context providers
├── navigation/         # Navigation configuration
├── screens/           # App screens
│   ├── LoginScreen.tsx
│   ├── RestaurantListScreen.tsx
│   ├── RestaurantDetailsScreen.tsx
│   ├── MyVouchersScreen.tsx
│   ├── CartScreen.tsx
│   └── ProfileScreen.tsx
├── services/          # API services
├── types/             # TypeScript type definitions
└── utils/            # Utility functions
```

## Key Features Implementation

### Authentication Flow
- Login/Register screens with form validation
- JWT token storage in AsyncStorage
- Authentication context for app-wide state
- Protected routes and navigation guards

### Restaurant Discovery
- Restaurant list with filtering and search
- Restaurant details with menu and voucher packages
- Image galleries and restaurant information
- Location-based filtering

### Voucher System
- Browse and purchase voucher packages
- QR code generation and display
- Voucher usage tracking
- Expiration date management

### Shopping Cart
- Add menu items to cart
- Quantity adjustment and special requests
- Persistent cart storage
- Checkout with payment integration

### Payment Integration
- Stripe payment processing
- Loyalty points redemption
- Payment history tracking
- Secure transaction handling

## API Integration

The mobile app connects to the EatOff backend server with full feature parity:

```typescript
// API Base URL
const API_BASE_URL = 'https://0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev';

// Key endpoints
/api/auth/login          // User authentication
/api/restaurants         // Restaurant discovery
/api/customers/:id/vouchers  // Voucher management
/api/complete-order      // Order processing
/api/dietary/recommendations // AI recommendations
```

## Development Notes

### Authentication
- Uses session-based authentication matching web app
- Stores JWT tokens securely in AsyncStorage
- Implements proper logout and token refresh

### Error Handling
- Comprehensive error boundaries
- Network error handling
- User-friendly error messages
- Fallback UI states

### Performance Optimization
- Lazy loading of screens
- Image optimization
- Efficient list rendering with FlatList
- Proper memory management

## Deployment

### Android App Store
1. Build production APK: `./build-working.sh`
2. Download from Expo dashboard
3. Upload to Google Play Console
4. Complete store listing and publish

### iOS App Store
1. Build for iOS: `npx eas build --platform ios --profile production`
2. Download IPA file
3. Upload to App Store Connect
4. Complete app review process

## Testing

### Demo Account
Use the demo credentials to test all features:
- Login with demo@example.com / DemoPassword123!
- Browse restaurants and voucher packages
- Test voucher purchasing and QR code display
- Try menu ordering and cart functionality

### Test Server Connection
The login screen includes a "Test Server Connection" button to verify backend connectivity.

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Clear cache: `npx expo start --clear`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

2. **Authentication Issues**
   - Check API base URL configuration
   - Verify demo credentials
   - Test server connection

3. **Network Issues**
   - Ensure backend server is running
   - Check internet connection
   - Verify API endpoints

### Support
For technical issues, check the EAS build logs or contact the development team.

## License
This mobile app is part of the EatOff platform and follows the same licensing terms.