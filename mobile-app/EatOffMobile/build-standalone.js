#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting EatOff Mobile APK Build Process...');

// Check if we're in the right directory
const currentDir = process.cwd();
console.log(`Current directory: ${currentDir}`);

// Update app.json to remove problematic configurations
const appJsonPath = path.join(currentDir, 'app.json');
let appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Ensure minimal working configuration
appConfig.expo = {
  ...appConfig.expo,
  plugins: [], // Remove all plugins for now
  platforms: ['android', 'ios']
};

// Write back the config
fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2));
console.log('✅ App configuration updated');

try {
  // Try to build using expo prebuild for Android
  console.log('🔧 Prebuilding for Android...');
  execSync('npx expo prebuild --platform android --no-install', { stdio: 'inherit' });
  
  console.log('📦 Building APK...');
  execSync('cd android && ./gradlew assembleRelease', { stdio: 'inherit' });
  
  console.log('🎉 APK built successfully!');
  console.log('📍 APK location: android/app/build/outputs/apk/release/app-release.apk');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // Try alternative approach with EAS
  console.log('🔄 Trying EAS build...');
  try {
    execSync('npx eas build --platform android --local --non-interactive', { stdio: 'inherit' });
    console.log('🎉 EAS build successful!');
  } catch (easError) {
    console.error('❌ EAS build also failed:', easError.message);
    
    // Final fallback - try basic expo build
    console.log('🔄 Trying basic expo build...');
    try {
      execSync('npx expo build:android --type apk', { stdio: 'inherit' });
      console.log('🎉 Basic expo build successful!');
    } catch (basicError) {
      console.error('❌ All build methods failed. Please check your configuration.');
      process.exit(1);
    }
  }
}