# Download EatOffAndroid Project to Your Laptop

## Option 1: Download from Replit (Recommended)

### Step 1: Download the Project Files
1. **From Replit Interface**:
   - Click on the **three dots (⋮)** in the file explorer
   - Select **"Download as ZIP"**
   - This downloads the entire project including the `android-app` folder

2. **Extract on Your Laptop**:
   ```bash
   # Extract the downloaded ZIP file
   unzip downloaded-project.zip
   cd your-project-folder/android-app/EatOffAndroid
   ```

### Step 2: Open in Android Studio
1. Launch **Android Studio**
2. Choose **"Open an existing Android Studio project"**
3. Navigate to the extracted `android-app/EatOffAndroid` folder
4. Click **"OK"** to open the project

## Option 2: Manual File Download

If you prefer to download specific files, here are the key directories:

### Essential Project Structure:
```
android-app/EatOffAndroid/
├── app/
│   ├── src/main/
│   │   ├── java/com/eatoff/android/
│   │   │   ├── MainActivity.java
│   │   │   ├── activities/LoginActivity.java
│   │   │   ├── adapters/RestaurantAdapter.java
│   │   │   ├── api/ApiService.java
│   │   │   ├── api/ApiClient.java
│   │   │   ├── models/Restaurant.java
│   │   │   ├── models/Customer.java
│   │   │   └── utils/AuthManager.java
│   │   ├── res/
│   │   │   ├── layout/activity_main.xml
│   │   │   ├── layout/activity_login.xml
│   │   │   ├── layout/item_restaurant.xml
│   │   │   ├── values/colors.xml
│   │   │   ├── values/strings.xml
│   │   │   └── values/themes.xml
│   │   └── AndroidManifest.xml
│   └── build.gradle
├── build.gradle
├── gradle.properties
├── settings.gradle
├── gradlew
├── gradlew.bat
└── QUICK_START.md
```

### Files to Download:
1. **Copy all files** from `android-app/EatOffAndroid/` directory
2. **Maintain the exact folder structure** as shown above
3. **Include all** `.java`, `.xml`, `.gradle`, and configuration files

## Option 3: Git Clone (If Project is in Repository)

If you have the project in a Git repository:

```bash
# Clone the repository
git clone [your-repository-url]
cd [repository-name]/android-app/EatOffAndroid

# Open in Android Studio
# File → Open → Select the EatOffAndroid folder
```

## After Download - Setup Steps

### 1. Update SDK Location
Edit `local.properties` file with your Android SDK path:

**Windows**:
```properties
sdk.dir=C\:\\Users\\[USERNAME]\\AppData\\Local\\Android\\Sdk
```

**macOS**:
```properties
sdk.dir=/Users/[USERNAME]/Library/Android/sdk
```

**Linux**:
```properties
sdk.dir=/home/[USERNAME]/Android/Sdk
```

### 2. Update Backend URL (If Needed)
In `app/src/main/java/com/eatoff/android/api/ApiClient.java`:

```java
// Current production URL
private static final String BASE_URL = 
    "https://0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev/api/";

// For local testing, change to:
private static final String BASE_URL = "http://10.0.2.2:5000/api/"; // Emulator
// or
private static final String BASE_URL = "http://[YOUR_IP]:5000/api/"; // Physical device
```

### 3. First Run in Android Studio
1. **Open Project**: Android Studio → Open → Select `EatOffAndroid` folder
2. **Gradle Sync**: Wait for automatic dependency download
3. **Create AVD**: Tools → AVD Manager → Create Virtual Device
4. **Run App**: Click Run button (green triangle)

### 4. Test the App
1. **Login Screen**: Use demo@example.com / DemoPassword123!
2. **Test Connection**: Verify backend connectivity
3. **Restaurant List**: Should load real data from your backend
4. **UI Testing**: Verify Material Design interface works

## Project Details

### App Features:
- **Native Android**: Java with Android SDK
- **Material Design 3**: Professional UI with orange/green branding
- **Backend Integration**: Connects to your live EatOff server
- **Authentication**: Session management with SharedPreferences
- **Restaurant Discovery**: RecyclerView with image loading
- **API Integration**: Retrofit 2 with proper error handling

### Technical Specifications:
- **Minimum SDK**: API 24 (Android 7.0)
- **Target SDK**: API 33 (Android 13)
- **Language**: Java 8+
- **Build System**: Gradle
- **Dependencies**: Material Design, Retrofit, Glide, Gson

### Ready for:
- Google Play Store deployment
- APK generation for distribution
- Production use with existing backend
- Further feature development

## Support Files Included:
- `QUICK_START.md` - 5-minute setup guide
- `ANDROID_STUDIO_SETUP.md` - Comprehensive setup instructions
- `TESTING_GUIDE.md` - Complete testing procedures
- Android Studio configuration files (`.idea` folder)
- Unit and instrumented test files

## Next Steps After Download:
1. **Test in Android Studio**: Follow QUICK_START.md
2. **Generate APK**: Use `./gradlew assembleDebug`
3. **Deploy to Device**: Install APK for testing
4. **Customize**: Add features or modify branding as needed

---

**The complete EatOffAndroid project is ready for download and immediate testing on your laptop with Android Studio.**