#!/bin/bash
# Mobile Build Script for EatOff Android/iOS
# Run this script locally after pulling from Git

export VITE_API_URL="https://eatoff.app"
export VITE_STRIPE_PUBLIC_KEY="pk_test_51RbmJeQ3QPubYtvxB6pBbUXh8L42lZnOb1ExsCudeQkyJAqtYhmnhrMO2subSlw5ZNozKF7ujkCA8hTM7NrPaCnD00YGZVJhTW"

echo "Building EatOff mobile app..."
echo "API URL: $VITE_API_URL"

npm run build && npx cap sync

echo ""
echo "Build complete! Now open Android Studio or Xcode:"
echo "  Android: npx cap open android"
echo "  iOS: npx cap open ios"
