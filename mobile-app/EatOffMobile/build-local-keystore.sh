#!/bin/bash

# EatOff Mobile APK Build - Local Keystore Solution
echo "Building EatOff Mobile APK with local keystore..."

# Change to mobile app directory
cd "$(dirname "$0")"

# Install Java if not present (required for keytool)
if ! command -v keytool &> /dev/null; then
    echo "Installing Java (required for keytool)..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y default-jdk
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install openjdk
    fi
fi

# Generate local keystore
echo "Generating local keystore..."
keytool -genkeypair -v -keystore eatoff-release-key.keystore -alias eatoff-key-alias -keyalg RSA -keysize 2048 -validity 10000 -storepass eatoff123 -keypass eatoff123 -dname "CN=EatOff, OU=Mobile, O=EatOff, L=City, ST=State, C=US"

# Create credentials.json for local keystore
echo "Creating credentials configuration..."
cat > credentials.json << 'EOF'
{
  "android": {
    "keystore": {
      "keystorePath": "./eatoff-release-key.keystore",
      "keystorePassword": "eatoff123",
      "keyAlias": "eatoff-key-alias",
      "keyPassword": "eatoff123"
    }
  }
}
EOF

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Install EAS CLI
echo "Installing EAS CLI..."
npm install -g @expo/eas-cli

# Login to EAS
echo "Logging into EAS..."
npx eas login

# Initialize EAS project
echo "Initializing EAS project..."
npx eas init

# Build APK with local keystore
echo "Building APK with local keystore..."
npx eas build --platform android --profile preview --local

echo "Build completed! APK should be in the current directory."
echo "Look for: build-*.apk"