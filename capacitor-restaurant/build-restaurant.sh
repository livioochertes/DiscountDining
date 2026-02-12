#!/bin/bash
set -e

echo "Building EatOff Restaurant App..."

echo "Step 1: Building web app..."
cd ..
npm run build
cd capacitor-restaurant

echo "Step 2: Copying build to www/ with restaurant mode injection..."
rm -rf www
cp -r ../dist/public www

INJECT_SCRIPT='<script>window.__EATOFF_APP_MODE__="restaurant";<\/script>'
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|<head>|<head>${INJECT_SCRIPT}|" www/index.html
else
  sed -i "s|<head>|<head>${INJECT_SCRIPT}|" www/index.html
fi

echo "Step 3: Restaurant mode injected into www/index.html"
echo "Done! Run 'npx cap sync' to sync with native projects."
