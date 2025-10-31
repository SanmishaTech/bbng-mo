# iOS Testing Build Guide

This guide explains how to create and install iOS testing builds for local testing without deploying to the App Store.

## 🎯 Overview

There are three types of iOS builds you can create:

1. **Ad-hoc Build (preview)** - Install on registered iOS devices (recommended for testing)
2. **Simulator Build** - Test on iOS Simulator on Mac
3. **TestFlight Build** - Distribute to testers via TestFlight

## 📋 Prerequisites

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
expo login
# or
eas login
```

### 3. Apple Developer Account Requirements

For **ad-hoc builds** (testing on physical devices):
- Apple Developer account ($99/year)
- Device UDIDs registered in Apple Developer portal
- Distribution certificate and provisioning profile (EAS will help set this up)

For **simulator builds** (Mac only):
- No Apple Developer account needed
- Mac with Xcode installed

## 🚀 Building for iOS

### Option 1: Quick Build (Recommended for Testing)

Build an **ad-hoc** iOS app that you can install on registered iOS devices:

```bash
npm run build:ios:preview
```

Or use the full command:
```bash
node scripts/build-ios.js preview
```

This will:
- Start the build process on EAS servers
- Output a build URL to track progress
- Create an IPA file you can download and install

### Option 2: Build for iOS Simulator (Mac Only)

Build for iOS Simulator (useful for Mac testing):

```bash
npm run build:ios:simulator
```

Or:
```bash
node scripts/build-ios.js preview-simulator
```

### Option 3: Wait for Build Completion

Add `--wait` flag to wait for the build to complete:

```bash
npm run build:ios:wait
```

Or:
```bash
node scripts/build-ios.js preview --wait
```

## 📱 Installing the Build on iOS Devices

### Method 1: Using EAS Dashboard (Easiest)

1. After build completes, visit the build URL shown in console
2. Or go to: https://expo.dev/accounts/sanmisha/projects/my-app/builds
3. Click on your latest build
4. Scan the QR code with your iOS device camera
5. Follow the installation prompts

**Important:** Your device UDID must be registered in:
- Apple Developer Portal
- The provisioning profile used for the build

### Method 2: Download IPA File

1. Visit your build page on EAS dashboard
2. Download the `.ipa` file
3. Install using one of these methods:
   - **Apple Configurator 2** (Mac app)
   - **Xcode** → Window → Devices and Simulators
   - **TestFlight** (if you uploaded to TestFlight)

### Method 3: Internal Distribution (TestFlight Alternative)

EAS provides internal distribution links that expire after 30 days:
1. Share the build URL from EAS dashboard
2. Testers open the link on their iOS device
3. Install directly without TestFlight

## 🔧 First-Time Setup

### Register iOS Devices

To install ad-hoc builds, register your device UDID:

1. **Get Device UDID:**
   - Connect iOS device to Mac
   - Open Finder → Select device → Click device info to show UDID
   - Or use online tools or apps

2. **Register via EAS:**
```bash
eas device:create
```
Follow the prompts to register your device.

3. **Or register manually:**
   - Go to: https://developer.apple.com/account/resources/devices
   - Click "+" and add your device UDID

### Setup iOS Credentials

On first build, EAS will guide you through:

1. **Distribution Certificate** - For signing the app
2. **Provisioning Profile** - Contains registered device UDIDs

EAS can manage these automatically:
```bash
eas credentials
```

Or let EAS handle it during first build.

## 📦 Build Profiles Explained

Your `eas.json` contains these iOS profiles:

### `preview` (Default)
```json
{
  "distribution": "internal",
  "ios": {
    "simulator": false
  }
}
```
- Creates ad-hoc build for physical devices
- Requires registered device UDIDs
- Good for team testing

### `preview-simulator`
```json
{
  "distribution": "internal",
  "ios": {
    "simulator": true
  }
}
```
- Creates simulator build
- Only works on Mac with Xcode
- No Apple Developer account needed

### `production`
```json
{
  "autoIncrement": true
}
```
- For App Store submission
- Use when ready to publish

## 🔍 Checking Build Status

### Via Command Line
```bash
eas build:list --platform ios --limit 5
```

### Via Dashboard
Visit: https://expo.dev/accounts/sanmisha/projects/my-app/builds

### Via Script
The build script outputs a direct link to your build.

## 🛠️ Troubleshooting

### Build Fails with "No Devices Registered"
- Register at least one device UDID (see above)
- Rebuild after registering devices

### "Unable to Install App"
- Check device UDID is in the provisioning profile
- Ensure iOS version matches minimum deployment target
- Try deleting app and reinstalling

### Certificate/Provisioning Issues
```bash
eas credentials --platform ios
```
Reset or regenerate credentials if needed.

### Build Takes Too Long
- iOS builds typically take 10-20 minutes
- Use `--wait` flag to auto-monitor progress

## 📊 Build Commands Reference

| Command | Description |
|---------|-------------|
| `npm run build:ios` | Start iOS ad-hoc build |
| `npm run build:ios:preview` | Same as above (explicit) |
| `npm run build:ios:simulator` | Build for iOS Simulator |
| `npm run build:ios:wait` | Build and wait for completion |
| `npm run build:ios:production` | Build for App Store |

## 💡 Tips for Testing

1. **Register Multiple Devices:**
   - You can register up to 100 devices per year
   - Add team members' devices for testing

2. **Use Internal Distribution:**
   - Share build URL directly with testers
   - No TestFlight setup needed
   - Expires after 30 days

3. **Version Management:**
   - Update `version` in `app.json` before builds
   - Use semantic versioning (e.g., 1.0.1, 1.0.2)

4. **Testing on Simulator First:**
   - Build simulator version for quick testing
   - Then build ad-hoc for device testing

## 🔗 Useful Links

- **EAS Build Dashboard:** https://expo.dev/accounts/sanmisha/projects/my-app/builds
- **Apple Developer Portal:** https://developer.apple.com/account
- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Device Registration:** https://docs.expo.dev/build/internal-distribution/#22-register-ios-devices

## 🎉 Quick Start

For first-time iOS testing build:

```bash
# 1. Login
expo login

# 2. Register your iOS device (get UDID first)
eas device:create

# 3. Build
npm run build:ios:preview

# 4. Wait for build (10-20 mins)
# 5. Scan QR code or download IPA from dashboard
# 6. Install on your iOS device
```

## 📞 Support

If you encounter issues:
1. Check build logs in EAS dashboard
2. Review Expo EAS documentation
3. Verify Apple Developer account status
4. Ensure device UDID is registered
