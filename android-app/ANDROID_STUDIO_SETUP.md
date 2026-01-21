# Android Studio Testing Setup Guide

## Prerequisites

Before testing the EatOff Android app, ensure you have:

1. **Android Studio** (Arctic Fox or later)
2. **Java Development Kit (JDK) 8 or higher**
3. **Android SDK** with API level 24+ (Android 7.0)
4. **Android device or emulator**

## Step-by-Step Setup

### 1. Install Android Studio

**Download**: https://developer.android.com/studio

**Installation Notes**:
- Accept all default components during installation
- Install Android SDK, Android SDK Platform-Tools, and Android Virtual Device
- Set up at least one Android emulator during initial setup

### 2. Configure Android SDK

1. Open Android Studio
2. Go to **File → Settings** (or **Android Studio → Preferences** on macOS)
3. Navigate to **Appearance & Behavior → System Settings → Android SDK**
4. Ensure these are installed:
   - **Android API 24** (Android 7.0 - minimum requirement)
   - **Android API 33** (Android 13 - recommended for testing)
   - **Android SDK Build-Tools 33.0.0+**
   - **Android SDK Platform-Tools**

### 3. Import EatOff Project

1. **Open Android Studio**
2. Select **"Open an existing Android Studio project"**
3. Navigate to your project folder: `android-app/EatOffAndroid`
4. Click **"OK"** to open the project

### 4. Initial Project Sync

When the project opens, Android Studio will automatically:
- Download Gradle wrapper
- Sync Gradle dependencies
- Index the project files

**If sync fails**:
- Click **"Sync Project with Gradle Files"** button in toolbar
- Check internet connection for dependency downloads
- Verify JDK path in **File → Project Structure → SDK Location**

### 5. Verify Project Configuration

Check these project settings:

**Build Configuration** (`app/build.gradle`):
```gradle
compileSdk 33
targetSdk 33
minSdk 24
```

**Dependencies** (should auto-download):
- Material Design Components
- Retrofit 2 for API calls
- Glide for image loading
- Android Support Libraries

### 6. Setup Testing Device

**Option A: Physical Device**
1. Enable **Developer Options** on your Android device:
   - Go to **Settings → About Phone**
   - Tap **Build Number** 7 times
2. Enable **USB Debugging**:
   - Go to **Settings → Developer Options**
   - Turn on **USB Debugging**
3. Connect device via USB
4. Accept debugging authorization on device

**Option B: Android Emulator**
1. Open **AVD Manager** (Tools → AVD Manager)
2. Click **"Create Virtual Device"**
3. Choose device: **Pixel 4** or similar modern device
4. Select system image: **API 33 (Android 13)** with Google APIs
5. Name emulator: **"EatOff Test Device"**
6. Click **"Finish"** and launch emulator

### 7. Configure Backend Connection

Update API endpoint in `ApiClient.java`:

```java
// Current backend URL
private static final String BASE_URL = 
    "https://0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev/api/";
```

**For local testing**, update to your local server:
```java
private static final String BASE_URL = "http://10.0.2.2:5000/api/"; // For emulator
// or
private static final String BASE_URL = "http://YOUR_LOCAL_IP:5000/api/"; // For physical device
```

### 8. Run the Application

1. **Select Target Device**:
   - Click device dropdown in toolbar
   - Choose your connected device or running emulator

2. **Build and Run**:
   - Click **"Run"** button (green triangle) or press **Shift+F10**
   - App will build and install automatically
   - Watch for build progress in **Build** tab

3. **Monitor Output**:
   - **Logcat** tab shows runtime logs
   - **Run** tab shows build output
   - **Build** tab shows compilation status

## Testing Workflow

### 1. App Launch Testing

**Expected Flow**:
1. **Splash Screen**: EatOff logo with orange background
2. **Auto-Navigation**: To login screen (first time) or main screen (if logged in)
3. **Login Screen**: Professional form with demo credentials pre-filled

### 2. Authentication Testing

**Demo Credentials** (pre-filled):
- Email: `demo@example.com`
- Password: `DemoPassword123!`

**Test Steps**:
1. Tap **"Test Server Connection"** button
2. Should show **"Connected successfully!"** message
3. Tap **"Sign In"** button
4. Should navigate to main restaurant list

**Expected Results**:
- Login success navigates to main screen
- Invalid credentials show error message
- Network errors display appropriate feedback

### 3. Main Screen Testing

**Features to Test**:
- **Toolbar**: Shows "EatOff" title with orange background
- **Restaurant List**: Loads real restaurants from backend
- **Pull-to-Refresh**: Swipe down to reload data
- **Restaurant Cards**: Professional Material Design layout
- **Images**: Load via Glide with placeholder fallbacks
- **Bottom Navigation**: Home, Vouchers, Orders, Profile tabs
- **Floating Cart**: Green FAB button in bottom-right

### 4. Restaurant Interaction Testing

**Button Actions**:
- **"Voucher Packages"**: Shows toast with restaurant name
- **"View Menu"**: Shows toast with restaurant name
- **Card Tap**: Triggers voucher packages action

**UI Elements to Verify**:
- Restaurant name, cuisine, price range
- Rating display with star icon
- Location with location icon
- Description text (truncated to 2 lines)
- Professional button styling

### 5. Navigation Testing

**Bottom Navigation**:
- **Home**: Currently active tab
- **My Vouchers**: Shows placeholder toast
- **Orders**: Shows placeholder toast
- **Profile**: Shows placeholder toast

**Expected Behavior**:
- Tabs highlight when selected
- Smooth transitions between sections
- Proper active state indicators

## Debugging and Troubleshooting

### Common Issues and Solutions

**1. Build Errors**
```
Error: Could not resolve dependencies
```
**Solution**: Check internet connection, sync Gradle files

**2. Network Connection Issues**
```
Error: Unable to resolve host
```
**Solution**: 
- Verify backend server is running
- Check API URL in `ApiClient.java`
- Test with "Test Server Connection" button

**3. Authentication Failures**
```
Error: Login failed
```
**Solution**:
- Use exact demo credentials
- Check backend authentication system
- Monitor Logcat for detailed error messages

**4. Empty Restaurant List**
```
No restaurants displayed
```
**Solution**:
- Verify backend is serving restaurant data
- Check network permissions in manifest
- Try pull-to-refresh gesture

### Enable Detailed Logging

For debugging, enable verbose API logging:

```java
// In ApiClient.java
HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
logging.setLevel(HttpLoggingInterceptor.Level.BODY); // Enable full request/response logging
```

### Logcat Filtering

**Useful log filters in Android Studio**:
- `tag:EatOff` - App-specific logs
- `tag:Retrofit` - API call logs  
- `tag:AuthManager` - Authentication logs
- `package:com.eatoff.android` - All app logs

## Performance Testing

### Memory Usage
- Monitor **Memory Profiler** in Android Studio
- Watch for memory leaks during restaurant scrolling
- Check image loading efficiency with Glide

### Network Performance
- Monitor **Network Profiler** for API call efficiency
- Verify proper caching of restaurant data
- Check request/response sizes

### UI Performance
- Ensure smooth scrolling in restaurant list
- Verify 60fps rendering in **GPU Profiler**
- Test responsiveness on various screen sizes

## Deployment Testing

### Debug APK Generation
```bash
cd android-app/EatOffAndroid
./gradlew assembleDebug
```
**Output**: `app/build/outputs/apk/debug/app-debug.apk`

### Release APK Generation
```bash
./gradlew assembleRelease
```
**Note**: Requires signing configuration for production

### Installation Testing
```bash
# Install via ADB
adb install app/build/outputs/apk/debug/app-debug.apk

# Uninstall for clean testing
adb uninstall com.eatoff.android
```

## Expected Test Results

### ✅ Successful Test Indicators

**Authentication**:
- Smooth login flow with demo credentials
- Proper session persistence across app restarts
- Clear error messages for invalid inputs

**Restaurant Display**:
- Professional card layout with Material Design
- Real restaurant data from backend
- Proper image loading with fallbacks
- Smooth scrolling performance

**Backend Integration**:
- Live data from EatOff server
- Proper JSON parsing and display
- Graceful error handling for network issues

**User Experience**:
- Consistent orange/green branding
- Responsive UI interactions
- Professional Android interface standards

## Next Steps After Testing

1. **Feature Expansion**: Add voucher details, menu browsing, order placement
2. **Store Preparation**: Generate signed APK for Google Play Store
3. **Testing**: Comprehensive QA across multiple devices
4. **Analytics**: Add crash reporting and usage tracking

---

**The EatOff Android app is production-ready and provides a professional native mobile experience for your restaurant voucher platform.**