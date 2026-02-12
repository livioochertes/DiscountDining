import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eatoff.restaurant',
  appName: 'EatOff Restaurant',
  webDir: '../dist/public',
  server: {
    androidScheme: 'https',
    allowNavigation: ['eatoff.app', '*.eatoff.app', 'accounts.google.com', 'appleid.apple.com']
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
    }
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
