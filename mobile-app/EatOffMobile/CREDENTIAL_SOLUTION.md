# EAS Build Credential Solution

## The Issue
```
✔ Using remote Android credentials (Expo server)
Generating a new Keystore is not supported in --non-interactive mode
    Error: build command failed.
```

EAS is trying to generate a new keystore but `--non-interactive` mode doesn't support keystore generation.

## Solution: Interactive Build with Credential Selection

### Step 1: Check Existing Credentials
```bash
cd mobile-app/EatOffMobile
npx eas credentials
```

### Step 2: Build with Interactive Mode (RECOMMENDED)
```bash
cd mobile-app/EatOffMobile
npx eas build --platform android --profile preview --clear-cache
```

**When prompted about keystore:**
- If you see "Use existing keystore from EAS servers?" → Select **YES**
- If you see "Generate a new Android Keystore?" → Select **NO**, then select use existing

### Step 3: Alternative - Use Development Profile
```bash
cd mobile-app/EatOffMobile
npx eas build --platform android --profile development --clear-cache
```

### Step 4: If Still Failing - Local Build
```bash
cd mobile-app/EatOffMobile
npx eas build --platform android --local
```

## Quick Commands to Try

Try these in order until one works:

**Command 1 (Interactive):**
```bash
cd mobile-app/EatOffMobile && npx eas build --platform android --profile preview --clear-cache
```

**Command 2 (Development):**
```bash
cd mobile-app/EatOffMobile && npx eas build --platform android --profile development --clear-cache
```

**Command 3 (Local):**
```bash
cd mobile-app/EatOffMobile && npx eas build --platform android --local
```

## What to Select When Prompted

### If you see this prompt:
```
? Select a build profile: (Use arrow keys)
❯ preview
  development
  production
```
**Select:** preview

### If you see this prompt:
```
? Would you like to use existing keystore from EAS servers?
❯ Yes
  No
```
**Select:** Yes

### If you see this prompt:
```
? Generate a new Android Keystore?
❯ Yes
  No
```
**Select:** No (then select use existing)

## Expected Success Flow

1. Run interactive build command
2. Select "preview" profile
3. Select "Use existing keystore" when prompted
4. Build proceeds without errors
5. APK download link provided

## Alternative: Use Build Script
```bash
./mobile-app/EatOffMobile/build-with-existing-creds.sh
```

This script will guide you through the interactive process.