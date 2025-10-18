# Android Build Guide - EAS Build API

This guide explains how to build and deploy your Android app using the EAS Build API.

## 🎯 Overview

Your app is configured with multiple build profiles:
- **development**: Development builds with dev client (APK)
- **preview**: Internal preview builds (APK) - for testing
- **preview-aab**: Internal preview builds (AAB format)
- **production**: Production builds (AAB) - for Play Store
- **production-apk**: Production builds (APK) - for direct distribution

## 📋 Prerequisites

### 1. Get Your EAS Access Token

You have two options:

#### Option A: Use Expo CLI (Recommended for development)
```bash
# Login to Expo
expo login

# The token will be automatically used
npm run build:android preview
```

#### Option B: Create a Personal Access Token (Recommended for CI/CD)
1. Go to [https://expo.dev/accounts/sanmisha/settings/access-tokens](https://expo.dev/accounts/sanmisha/settings/access-tokens)
2. Click "Create Token"
3. Give it a name (e.g., "CI/CD Build Token")
4. Copy the token and save it securely

```bash
# Set the token as an environment variable
export EAS_TOKEN=your_token_here

# Or add to your ~/.bashrc or ~/.zshrc
echo 'export EAS_TOKEN=your_token_here' >> ~/.bashrc
```

### 2. Install Dependencies (if not already done)
```bash
npm install
# or
bun install
```

## 🚀 Building Your Android App

### Method 1: Using NPM Scripts (Easiest)

```bash
# Build preview APK (for testing)
npm run build:android

# Build preview APK with specific profile
npm run build:android preview

# Build production AAB (for Play Store)
npm run build:android production

# Build and wait for completion
npm run build:android:wait preview
```

### Method 2: Using the Node.js Script Directly

```bash
# Basic usage
node scripts/build-android.js preview

# Wait for build to complete
node scripts/build-android.js preview --wait

# Build production
node scripts/build-android.js production
```

### Method 3: Using the Shell Script

```bash
# Make the script executable (first time only)
chmod +x scripts/build-android.sh

# Run the build
EAS_TOKEN=your_token ./scripts/build-android.sh preview

# Or if token is already exported
./scripts/build-android.sh production
```

### Method 4: Using curl Directly (for CI/CD)

```bash
curl -X POST "https://api.expo.dev/v2/builds" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EAS_TOKEN" \
  -H "Expo-Session: $EAS_TOKEN" \
  -d '{
    "projectId": "7cfd1d65-2d39-4e08-9d87-7f1231e7baa5",
    "platform": "android",
    "profile": "preview"
  }'
```

## 📊 Monitoring Build Progress

### Check Build Status via Web
Visit: `https://expo.dev/accounts/sanmisha/projects/my-app/builds`

### Check Build Status via API
```bash
# Get build ID from the build trigger response
BUILD_ID=your_build_id_here

# Check status
curl -H "Authorization: Bearer $EAS_TOKEN" \
  "https://api.expo.dev/v2/builds/$BUILD_ID"
```

### Using the Node.js Script
```bash
# This will poll the build status until completion
node scripts/build-android.js preview --wait
```

## 📥 Downloading Your Build

Once the build completes:

1. **Via Web Dashboard**: 
   - Go to your build URL
   - Click the download button

2. **Via API Response**:
   - The build completion includes a `buildUrl` field
   - Download directly: `curl -o app.apk [buildUrl]`

3. **Via Script**:
   - The `--wait` flag will display the download URL when ready

## 🔧 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Android

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build Android App
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
        run: node scripts/build-android.js production --wait
```

### GitLab CI Example

```yaml
build-android:
  image: node:18
  script:
    - npm install
    - node scripts/build-android.js production --wait
  only:
    - main
  variables:
    EAS_TOKEN: $EAS_TOKEN
```

## 🎯 Build Profiles Explained

### Development
- **Purpose**: Local development and testing
- **Output**: APK
- **Features**: Includes dev client for hot reloading

### Preview
- **Purpose**: Internal testing and QA
- **Output**: APK (easy to install on devices)
- **Distribution**: Internal only

### Preview-AAB
- **Purpose**: Testing AAB format before production
- **Output**: AAB (Android App Bundle)
- **Distribution**: Internal only

### Production
- **Purpose**: Play Store submission
- **Output**: AAB (required by Play Store)
- **Distribution**: Public or Internal Testing tracks

### Production-APK
- **Purpose**: Direct distribution outside Play Store
- **Output**: APK
- **Distribution**: Direct download/sideload

## 🔐 Security Best Practices

1. **Never commit EAS_TOKEN** to version control
2. Use environment variables or CI/CD secrets
3. Rotate tokens periodically
4. Use separate tokens for different environments
5. Limit token permissions if possible

## 🐛 Troubleshooting

### "No EAS token found"
- Ensure `EAS_TOKEN` is set: `echo $EAS_TOKEN`
- Or login with: `expo login`

### "Build failed"
- Check build logs in the Expo dashboard
- Verify all required credentials are configured
- Ensure dependencies are compatible

### "API request failed"
- Verify token is valid
- Check internet connection
- Ensure project ID is correct

### Build is stuck in queue
- EAS Build uses a queue system
- Free tier has limited concurrent builds
- Consider upgrading for faster builds

## 📚 Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build API Reference](https://docs.expo.dev/build-reference/api/)
- [Android App Bundle (AAB) Guide](https://developer.android.com/guide/app-bundle)
- [Expo Application Services](https://expo.dev/eas)

## 🆘 Support

- **Expo Forums**: [https://forums.expo.dev](https://forums.expo.dev)
- **Discord**: [https://chat.expo.dev](https://chat.expo.dev)
- **GitHub Issues**: Report issues specific to this project

---

Last Updated: October 2025
