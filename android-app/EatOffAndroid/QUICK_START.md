# EatOff Android - Quick Start Guide

## 🚀 Get Testing in 5 Minutes

### 1. Open in Android Studio
1. Launch **Android Studio**
2. Choose **"Open an existing Android Studio project"**
3. Navigate to: `android-app/EatOffAndroid`
4. Click **"OK"**

### 2. Wait for Sync
- Android Studio will automatically download dependencies
- Watch the progress bar at the bottom
- Wait for "Gradle sync finished" message

### 3. Setup Device
**Emulator** (Recommended):
- Click **"AVD Manager"** in toolbar
- Create new device: **Pixel 4** with **API 33**
- Launch emulator

**Physical Device**:
- Enable **Developer Options** and **USB Debugging**
- Connect via USB and accept debugging

### 4. Run the App
1. Select your device from dropdown in toolbar
2. Click **"Run"** button (green triangle)
3. App builds and installs automatically

### 5. Test Login
- App opens to login screen with demo credentials
- Tap **"Test Server Connection"** → Should show "Connected!"
- Tap **"Sign In"** → Should navigate to restaurant list

### 6. Verify Features
- **Restaurant List**: Real data from your backend
- **Professional UI**: Material Design with orange branding
- **Pull to Refresh**: Swipe down to reload
- **Bottom Navigation**: Tap tabs to see toast messages

## ✅ Expected Results

**Login Screen**:
- EatOff logo and professional form
- Demo credentials pre-filled
- Test connection shows success

**Main Screen**:
- Live restaurant data from backend
- Professional card layouts
- Smooth scrolling and interactions
- Orange/green branding throughout

## 🐛 Quick Troubleshooting

**Sync Failed**: Check internet connection, try "Sync Project" again

**Build Error**: Ensure JDK 8+ installed, check SDK location in settings

**Login Failed**: Verify backend server is running, use exact demo credentials

**Empty List**: Check network connection, try pull-to-refresh

## 📱 Demo Credentials
- **Email**: `demo@example.com`
- **Password**: `DemoPassword123!`

## 🔗 Backend Connection
App connects to: `https://0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev/api/`

---

**Ready to test! The app provides a professional native Android experience for your EatOff platform.**