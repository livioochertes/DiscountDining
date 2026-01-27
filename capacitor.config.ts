import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eatoff.app',
  appName: 'EatOff',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: ['eatoff.app', '*.eatoff.app']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      splashFullScreen: false,
      splashImmersive: false
    },
    CapacitorHttp: {
      enabled: true
    },
    Browser: {
      // Use Android Custom Tabs which handles deep links better
      androidOpenInAppBrowser: true
    }
  },
  android: {
    // Allow deep links to be handled automatically
    allowMixedContent: true
  }
};

export default config;
