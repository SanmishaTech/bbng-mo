# iOS Testing Build - Quick Start 🚀

Get your iOS testing build in 5 steps!

## Step 1: Login to Expo
```bash
expo login
```
Enter your credentials when prompted.

## Step 2: Get Your Device UDID

### On Mac:
1. Connect your iPhone/iPad via USB
2. Open **Finder**
3. Select your device in sidebar
4. Click on device info under device name to reveal UDID
5. Right-click and copy UDID

### On iPhone (without Mac):
1. Install app "UDID Finder" from App Store
2. Open app to see your UDID
3. Email it to yourself

## Step 3: Register Your Device
```bash
eas device:create
```
Paste your UDID when prompted.

## Step 4: Build iOS App
```bash
npm run build:ios:preview
```

The script will:
- Start build on EAS servers ☁️
- Show build URL (bookmark this!)
- Take 10-20 minutes ⏰

## Step 5: Install on Your Device

### Option A: Scan QR Code (Easiest)
1. Build will show a QR code or URL
2. Open on your iPhone
3. Tap "Install"
4. Trust the certificate in Settings

### Option B: Via EAS Dashboard
1. Visit build URL from Step 4
2. Open on your iPhone Safari
3. Tap download link
4. Install from Settings

## ✅ Verify Installation

After install, if you see "Untrusted Developer":
1. Go to **Settings** → **General** → **VPN & Device Management**
2. Tap on your developer certificate
3. Tap **Trust**

## 🔄 Updating the Build

To test new changes:
```bash
npm run build:ios:preview
```
Each build creates a new version.

## 📱 Testing Workflow

1. Make changes to your code
2. Commit changes (optional but recommended)
3. Run `npm run build:ios:preview`
4. Wait for build completion
5. Install new build on device
6. Test!

## ⚡ Quick Commands

| Command | What it does |
|---------|-------------|
| `npm run build:ios:preview` | Build for device testing |
| `npm run build:ios:simulator` | Build for Mac simulator |
| `npm run build:ios:wait` | Build and wait (don't close terminal) |
| `eas build:list --platform ios` | See all your builds |

## 🐛 Common Issues

### "Unable to install app"
- **Fix:** Check your UDID is registered correctly
- **Command:** `eas device:list` to verify

### "Build failed"
- **Fix:** Check build logs at the build URL
- **Common cause:** Certificate/provisioning issues
- **Solution:** Run `eas credentials --platform ios` and regenerate

### "App keeps crashing"
- **Fix:** Check logs via Xcode Console or crash reports
- **Debug:** Use `console.log()` statements liberally

### "No permission to install"
- **Fix:** Trust certificate in Settings (see Step 5)

## 🎯 Pro Tips

1. **Register multiple devices:** Add your team's devices for testing
   ```bash
   eas device:create
   ```

2. **Monitor builds:** Keep the build URL tab open to watch progress

3. **Use build:wait:** Add `--wait` if you want script to wait for completion

4. **Version tracking:** Update version in `app.json` before each build

5. **Build expiry:** Builds expire after 30 days, rebuild if needed

## 📞 Need Help?

1. Check detailed guide: [IOS_BUILD_GUIDE.md](./IOS_BUILD_GUIDE.md)
2. View build logs in EAS dashboard
3. Check Expo docs: https://docs.expo.dev/build/introduction/

## 🎉 That's It!

You now have a testing build on your iOS device. Happy testing! 🚀

---

**Next Steps:**
- Share build URL with testers
- Get feedback
- Iterate and improve
- When ready, build for App Store: `npm run build:ios:production`
