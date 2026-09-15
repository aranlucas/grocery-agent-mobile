---
name: expo-dev-client
description: "Framework (OSS). Build and use a custom Expo development client locally when Expo Go does not contain the app's native modules. Use for CNG projects, config plugins, custom native modules, native debugging, and connecting a local client to Metro."
license: MIT
---

# Expo development client

`expo-dev-client` is an open-source local development runtime for projects that need native modules or config plugins outside Expo Go. Prefer a local development build so native changes are reproducible and do not require a hosted build service.

## When it is needed

Use a development client for local Expo modules, config plugins, widgets/extensions, third-party native modules, or native push/deep-link testing. Expo Go is sufficient only when every native dependency is already included in that Expo Go version.

## CNG workflow

1. Inspect `app.json`/`app.config.*`, package versions, and whether `android/` or `ios/` are generated or hand-maintained.
2. Install the client with `npx expo install expo-dev-client`.
3. For CNG projects, run `npx expo prebuild --no-install` after native configuration changes and review the generated diff.
4. Build locally with `npx expo run:android` or `npx expo run:ios`.
5. Start Metro for the client with `npx expo start --dev-client`; the project may wrap this command with its agent CLI.

Android requires the Android SDK, an emulator/device, and a working Gradle toolchain. iOS requires full Xcode and CocoaPods when the project uses pods. Command Line Tools alone cannot build an iOS client.

## Native changes and iteration

- Rebuild after adding or changing a native dependency, config plugin, app identifier, permissions, or native build setting.
- JavaScript-only changes can use Fast Refresh after the development client is installed.
- Do not attach Metro to a release binary and expect hot reload; install a Debug development client instead.
- Check the device logs and the app's runtime error surface after the first launch.

## Verify

Exercise the affected flow on each requested platform, including Android Back, keyboard handling, deep links, permissions, dark mode, reduced motion, and accessibility labels. Keep the client and Metro project root matched.

For store or signed release artifacts, use the `local-app-release` skill. For local simulator interaction, use `local-simulator`.

## References

- Development builds: https://docs.expo.dev/develop/development-builds/introduction/
- `expo-dev-client`: https://docs.expo.dev/versions/latest/sdk/dev-client/
- Local app development: https://docs.expo.dev/guides/local-app-development/
