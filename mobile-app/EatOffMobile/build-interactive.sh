#!/bin/bash

# Interactive EatOff APK build that handles keystore generation
echo "Building EatOff APK with interactive keystore generation..."

cd "$(dirname "$0")"

# Run interactive build and auto-answer keystore questions
echo "Starting interactive build..."
echo "This will generate a keystore automatically when prompted."

# Use expect to automate the interactive responses
expect << 'EOF'
set timeout 600
spawn npx eas build --platform android --profile development --clear-cache

# Handle keystore generation prompt
expect "Generate a new Android Keystore?" {
    send "y\r"
    exp_continue
}

# Handle any other prompts
expect eof
EOF

echo "Build completed. Check EAS dashboard for APK download."
echo "Dashboard: https://expo.dev/accounts/livioochertes/projects/rest-express"