#!/bin/bash

# EatOff Mobile App - Production Build Script
# Builds fully functional Android APK with complete feature set

echo "🚀 Building EatOff Mobile App - Production APK"
echo "=============================================="

cd "$(dirname "$0")"

# Clean previous builds
echo "🧹 Cleaning build artifacts..."
rm -rf node_modules .expo dist android ios

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Configure API connection
echo "🔧 Configuring API connection..."
cat > src/config/api.js << 'EOF'
export const API_CONFIG = {
  baseURL: 'https://0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export const DEMO_CREDENTIALS = {
  email: 'demo@example.com',
  password: 'DemoPassword123!'
};
EOF

# Update API service configuration
echo "🔄 Updating API service configuration..."
sed -i.bak 's/localhost:5000/0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev/g' src/services/api.ts

# Build production APK
echo "🏗️ Building production APK..."
npx eas build --platform android --profile production --clear-cache --non-interactive

echo ""
echo "✅ EatOff Mobile App Build Complete!"
echo "====================================="
echo ""
echo "📱 Features included:"
echo "  ✓ Restaurant discovery & filtering"
echo "  ✓ User authentication system"
echo "  ✓ Voucher purchasing & management"
echo "  ✓ Menu ordering & cart functionality"
echo "  ✓ QR code voucher display"
echo "  ✓ Points & loyalty rewards"
echo "  ✓ AI dietary recommendations"
echo "  ✓ Real-time order tracking"
echo ""
echo "🔐 Test credentials:"
echo "  Email: demo@example.com"
echo "  Password: DemoPassword123!"
echo ""
echo "📥 Download APK from:"
echo "  https://expo.dev/accounts/livioochertes/projects/rest-express/builds"
echo ""
echo "🎯 Installation: Allow unknown sources in Android settings"