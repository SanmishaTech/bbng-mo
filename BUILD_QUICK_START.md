# 🚀 Quick Start: Building Android App

## Step 1: Get Your EAS Token

### Option A: Use existing Expo login
```bash
expo login
```

### Option B: Create a token
1. Visit: https://expo.dev/accounts/sanmisha/settings/access-tokens
2. Create a new token
3. Export it:
```bash
export EAS_TOKEN=your_token_here
```

## Step 2: Build Your App

### For Testing (APK):
```bash
npm run build:android:preview
```

### For Production (AAB for Play Store):
```bash
npm run build:android:production
```

### Wait for build to complete:
```bash
npm run build:android:wait
```

## Step 3: Download Your App

After the build completes, you'll get:
- Build URL in the terminal
- Download link for your APK/AAB

Visit the build URL to download your app!

## 📊 Monitor Builds

Dashboard: https://expo.dev/accounts/sanmisha/projects/my-app/builds

## 🎯 Available Build Profiles

| Profile | Output | Use Case |
|---------|--------|----------|
| preview | APK | Testing & QA |
| preview-aab | AAB | Test AAB format |
| production | AAB | Play Store |
| production-apk | APK | Direct distribution |

## 🆘 Troubleshooting

**No EAS token found?**
```bash
# Check if token is set
echo $EAS_TOKEN

# Or login
expo login
```

**Want to see all build options?**
```bash
node scripts/build-android.js --help
```

## 📚 Full Documentation

See `docs/BUILD_GUIDE.md` for complete documentation.

---

**Project Info:**
- Project ID: `7cfd1d65-2d39-4e08-9d87-7f1231e7baa5`
- Package: `com.sanmisha.bbng`
- Owner: `sanmisha`
