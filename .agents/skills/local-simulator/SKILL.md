---
name: local-simulator
description: "Run and drive Expo apps on local iOS Simulators and Android emulators using Expo CLI, adb, xcrun simctl, and optional open-source test drivers. Use for local screenshots, smoke tests, accessibility checks, and interactive debugging."
license: MIT
---

# Local simulator and emulator

Use the platform simulator that is installed on the current machine. Check availability before changing code or starting a long build. If the requested platform is unavailable, say so instead of silently switching to a hosted device service.

## Android

- Check devices with `adb devices` and boot an AVD through Android Studio or the installed emulator tooling.
- Build/install a development client with `npx expo run:android`, or connect an installed dev client with `npx expo start --dev-client`.
- Use `adb shell screencap`, `adb shell input`, and `adb logcat` for screenshots, basic interaction, and crash evidence.

## iOS

- Check the toolchain with `xcodebuild -version` and devices with `xcrun simctl list devices available`.
- Boot a simulator with `xcrun simctl boot <UDID>` and open it with `open -a Simulator` when Simulator.app is available.
- Build/install with `npx expo run:ios`; use `npx expo start --dev-client` for JavaScript iteration.
- Use `xcrun simctl io <UDID> screenshot`, `xcrun simctl launch`, and `xcrun simctl spawn` for evidence and diagnostics.

## Verification loop

1. Record the exact device, OS, orientation, appearance, text size, and reduced-motion state.
2. Build or install the correct development/release variant; a release binary will not hot-reload from Metro.
3. Exercise the requested flow through visible accessibility labels or test IDs.
4. Check keyboard behavior, Android Back, deep links, dark mode, reduced motion, narrow/wide layouts, and crash logs when relevant.
5. Stop Metro and shut down temporary devices when the task is complete.

Appium and other local drivers are optional. Install them only when a test needs capabilities that `adb`, `simctl`, or the project’s existing agent tooling cannot provide.

## References

- Expo development builds: https://docs.expo.dev/develop/development-builds/introduction/
- Android Debug Bridge: https://developer.android.com/tools/adb
- `simctl`: https://developer.apple.com/library/archive/documentation/IDEs/Conceptual/iOS_Simulator_User_Guide/ManagingYourAppinSimulator.html
- Appium: https://appium.io/docs/en/latest/
