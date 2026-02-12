# EatOff Restaurant - Mobile App

## Build Instructions

### Prerequisites
- Node.js 18+
- Xcode (for iOS)
- Android Studio (for Android)

### Setup

1. Build the web app from the root directory:
```bash
cd ..
npm run build
```

2. Install dependencies:
```bash
npm install
```

3. Add platforms:
```bash
npx cap add ios
npx cap add android
```

4. Sync the build:
```bash
npx cap sync
```

### Opening in IDE

- **iOS**: `npx cap open ios`
- **Android**: `npx cap open android`

### App Detection

The restaurant app is detected via the `EATOFF_APP_MODE` preference set in `capacitor.config.ts`.
The web app checks `Capacitor.getPlugins()` or reads from a `window.__EATOFF_APP_MODE__` flag
injected at build time to determine which UI to show.

### Bundle IDs
- **iOS**: `com.eatoff.restaurant`
- **Android**: `com.eatoff.restaurant`
