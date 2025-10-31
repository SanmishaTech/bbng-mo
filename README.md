# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Build for Testing/Production

This project includes automated build scripts for creating Android and iOS builds.

### Android Builds

```bash
# Build Android APK for testing
npm run build:android:preview

# Build and wait for completion
npm run build:android:wait

# Build for production (AAB)
npm run build:android:production
```

### iOS Builds

```bash
# Build iOS ad-hoc for testing on devices
npm run build:ios:preview

# Build for iOS Simulator (Mac only)
npm run build:ios:simulator

# Build and wait for completion
npm run build:ios:wait

# Build for App Store
npm run build:ios:production
```

**📱 For detailed iOS testing build setup and installation instructions, see [iOS Build Guide](./docs/IOS_BUILD_GUIDE.md)**

### Requirements

- **EAS CLI:** Install with `npm install -g eas-cli`
- **Expo Account:** Login with `expo login`
- **For iOS:** Apple Developer account and registered device UDIDs
- **For Android:** No special requirements for testing builds

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
