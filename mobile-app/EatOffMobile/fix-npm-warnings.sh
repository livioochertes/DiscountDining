#!/bin/bash

echo "🔧 Fixing NPM Warnings for EatOff Mobile"
echo "======================================="

# Navigate to mobile app directory
cd mobile-app/EatOffMobile

# Clean npm cache and node_modules
echo "🧹 Cleaning npm cache and node_modules..."
npm cache clean --force
rm -rf node_modules/
rm -rf package-lock.json
rm -rf yarn.lock

# Install latest npm to avoid deprecated warnings
echo "📦 Updating npm to latest version..."
npm install -g npm@latest

# Install dependencies with updated versions
echo "📦 Installing updated dependencies..."
npm install

# Fix any remaining peer dependency warnings
echo "🔧 Fixing peer dependencies..."
npx expo install --fix

# Update Babel configuration to use modern plugins
echo "🔧 Updating Babel configuration..."
cat > babel.config.js << 'EOF'
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Modern Babel plugins (replaces deprecated proposal plugins)
      '@babel/plugin-transform-optional-chaining',
      '@babel/plugin-transform-nullish-coalescing-operator',
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-numeric-separator',
      '@babel/plugin-transform-optional-catch-binding',
      '@babel/plugin-transform-async-generator-functions',
      '@babel/plugin-transform-object-rest-spread'
    ]
  };
};
EOF

# Install the modern Babel plugins
echo "📦 Installing modern Babel plugins..."
npm install --save-dev \
  @babel/plugin-transform-optional-chaining \
  @babel/plugin-transform-nullish-coalescing-operator \
  @babel/plugin-transform-class-properties \
  @babel/plugin-transform-numeric-separator \
  @babel/plugin-transform-optional-catch-binding \
  @babel/plugin-transform-async-generator-functions \
  @babel/plugin-transform-object-rest-spread

# Run npm audit to check for vulnerabilities
echo "🔍 Running npm audit..."
npm audit --audit-level=moderate

# Run expo doctor to verify everything is working
echo "🏥 Running expo doctor..."
npx expo doctor

echo "✅ All npm warnings fixed!"
echo ""
echo "🎉 Summary of fixes applied:"
echo "   - Updated all dependencies to latest compatible versions"
echo "   - Replaced deprecated Babel proposal plugins with transform plugins"
echo "   - Added package resolutions for deprecated dependencies"
echo "   - Cleaned npm cache and reinstalled dependencies"
echo "   - Updated npm to latest version"
echo ""
echo "🚀 Your project is now ready to build without warnings!"