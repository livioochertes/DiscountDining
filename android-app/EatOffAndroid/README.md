# EatOff Android App

A native Android application for the EatOff restaurant voucher platform, built with Java and Android SDK.

## Features

- **Restaurant Discovery**: Browse and filter restaurants by cuisine, location, and price range
- **Voucher Management**: Purchase and manage restaurant voucher packages
- **Menu Ordering**: Browse restaurant menus and place orders
- **User Authentication**: Secure login and profile management
- **QR Code System**: Display voucher QR codes for restaurant redemption
- **Real-time Updates**: Live restaurant data and order status updates

## Technology Stack

- **Language**: Java
- **Framework**: Native Android (API 24+)
- **Architecture**: MVP (Model-View-Presenter)
- **Networking**: Retrofit 2 + OkHttp
- **Image Loading**: Glide
- **JSON Parsing**: Gson
- **QR Code**: ZXing Android Embedded
- **UI Components**: Material Design 3

## Prerequisites

- Android Studio Arctic Fox or later
- Java 8 or later
- Android SDK API 24 (Android 7.0) or higher
- EatOff backend server running

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd android-app/EatOffAndroid
   ```

2. **Open in Android Studio**
   - Launch Android Studio
   - Select "Open an existing Android Studio project"
   - Navigate to the `android-app/EatOffAndroid` folder

3. **Configure API Endpoint**
   - Open `app/src/main/java/com/eatoff/android/api/ApiClient.java`
   - Update `BASE_URL` to match your backend server URL
   - Current URL: `https://0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev/api/`

4. **Build and Run**
   - Connect an Android device or start an emulator
   - Click "Run" or press Shift+F10
   - The app will build and install automatically

## Project Structure

```
app/src/main/java/com/eatoff/android/
├── activities/          # Activity classes
│   ├── LoginActivity.java
│   ├── SplashActivity.java
│   └── ...
├── adapters/           # RecyclerView adapters
│   ├── RestaurantAdapter.java
│   └── ...
├── api/                # API service and client
│   ├── ApiClient.java
│   └── ApiService.java
├── models/             # Data models
│   ├── Restaurant.java
│   ├── Customer.java
│   ├── Voucher.java
│   └── ...
├── utils/              # Utility classes
│   ├── AuthManager.java
│   └── ...
└── MainActivity.java   # Main activity
```

## Key Components

### Authentication
- `AuthManager`: Handles user session management
- `LoginActivity`: User login interface
- Demo credentials: `demo@example.com` / `DemoPassword123!`

### API Integration
- `ApiClient`: Retrofit client configuration
- `ApiService`: API endpoint definitions
- Automatic JSON parsing with Gson
- Request/response logging for debugging

### Restaurant Features
- Restaurant browsing with filtering
- Voucher package display and purchasing
- Menu viewing and ordering
- QR code generation for vouchers

### UI Components
- Material Design 3 components
- Custom orange/green color scheme
- Responsive layouts for different screen sizes
- Professional card-based interface

## Building APK

### Debug Build
```bash
./gradlew assembleDebug
```
APK location: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build
```bash
./gradlew assembleRelease
```
APK location: `app/build/outputs/apk/release/app-release.apk`

## Testing

### Unit Tests
```bash
./gradlew test
```

### Instrumentation Tests
```bash
./gradlew connectedAndroidTest
```

### Connection Test
The app includes a "Test Server Connection" button on the login screen to verify backend connectivity.

## Configuration

### Backend URL
Update the `BASE_URL` in `ApiClient.java`:
```java
private static final String BASE_URL = "https://your-backend-url.com/api/";
```

### App Permissions
Required permissions (already configured in `AndroidManifest.xml`):
- `INTERNET`: For API calls
- `ACCESS_NETWORK_STATE`: For network status checking

## Deployment

### Google Play Store
1. Generate signed APK with release keystore
2. Upload to Google Play Console
3. Complete app store listing
4. Submit for review

### Internal Distribution
1. Build release APK
2. Distribute APK file directly
3. Enable "Unknown Sources" on target devices

## API Endpoints

The app connects to these backend endpoints:

- `POST /auth/login` - User authentication
- `GET /restaurants` - Restaurant listing
- `GET /restaurants/{id}` - Restaurant details
- `GET /customers/{id}/vouchers` - User vouchers
- `POST /orders` - Create order
- `GET /vouchers/{id}/qr-code` - QR code generation

## Troubleshooting

### Common Issues

1. **Network Error**
   - Check internet connection
   - Verify backend server is running
   - Confirm API URL is correct

2. **Login Failed**
   - Use demo credentials: `demo@example.com` / `DemoPassword123!`
   - Check backend authentication system

3. **Build Errors**
   - Clean project: `Build > Clean Project`
   - Rebuild: `Build > Rebuild Project`
   - Check Android SDK versions

### Debug Logging
Enable detailed logging in `ApiClient.java`:
```java
logging.setLevel(HttpLoggingInterceptor.Level.BODY);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the EatOff platform and follows the main project's licensing terms.

## Support

For technical support or questions:
- Check the troubleshooting section
- Review API documentation
- Contact the development team

---

**EatOff Android App** - Native Android application for restaurant voucher management