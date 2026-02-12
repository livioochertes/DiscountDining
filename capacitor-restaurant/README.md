# EatOff Restaurant - Mobile App

## Build Instructions

### Prerequisites
- Node.js 18+
- Xcode (for iOS)
- Android Studio (for Android)

### Setup

1. Install dependencies in the root project:
```bash
cd ..
npm install
```

2. Install dependencies in this directory:
```bash
npm install
```

3. Build the restaurant app (builds web + injects restaurant mode):
```bash
npm run build
```

This script:
- Builds the web app from the root directory
- Copies the build output to `www/`
- Injects `window.__EATOFF_APP_MODE__ = "restaurant"` into `index.html`
- The app will automatically open the Restaurant Sign-in page

4. Add platforms (first time only):
```bash
npx cap add ios
npx cap add android
```

5. Sync the build:
```bash
npx cap sync
```

### Opening in IDE

- **iOS**: `npx cap open ios`
- **Android**: `npx cap open android`

### How Restaurant Mode Works

The restaurant app uses the same web codebase as the client app, but with a special flag
`window.__EATOFF_APP_MODE__ = "restaurant"` injected at build time into the HTML.

This flag tells the React app to:
- Redirect directly to `/m/restaurant/signin` (Sign-in only, no Sign-up)
- Show the restaurant dashboard after login
- Hide client-specific navigation

### Testing in Browser

To test restaurant mode in the browser, add `?mode=restaurant` to the URL:
```
https://your-app-url.com/?mode=restaurant
```

### Bundle IDs
- **iOS**: `com.eatoff.restaurant`
- **Android**: `com.eatoff.restaurant`
