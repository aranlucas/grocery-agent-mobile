---
name: local-app-release
description: "Build and release Expo or React Native apps with local open-source toolchains. Use for Android APK/AAB and iOS IPA/App Store artifacts, native signing, versioning, store metadata, and release verification without a hosted build service."
license: MIT
---

# Local app release

Use the project's own native toolchains for reproducible builds. Continuous Native Generation (CNG) projects should generate native directories from app config; manually maintained native projects must keep their existing build files and scripts.

## Choose the build path

- Expo CNG: inspect `app.json`/`app.config.*`, run `npx expo prebuild` when native configuration changes, then use `npx expo run:android` or `npx expo run:ios` for local development builds.
- Android release: use `android/gradlew assembleRelease` for an APK or `android/gradlew bundleRelease` for an AAB. Confirm the application ID, version code, signing configuration, and output artifact.
- iOS release: use Xcode's archive/export workflow or `xcodebuild archive` and `xcodebuild -exportArchive`. A full Xcode installation is required; Command Line Tools alone cannot produce an iOS archive.
- fastlane is an optional open-source wrapper for repeatable signing, metadata, and store uploads. Reuse an existing `Fastfile` and `Matchfile`; do not introduce a new signing system without a reason.

## Safe workflow

1. Read the package manager, Expo config, `eas.json` if present, native directories, and existing CI/release scripts. Preserve existing profiles and naming.
2. Run the project checks and a debug build before a release build.
3. Generate native projects only when the app is CNG or the user explicitly asks to regenerate them. Review the native diff before building.
4. Build the requested platform locally and inspect the artifact's package/bundle identifier, version, architecture, and signing state.
5. Upload or submit only when the user explicitly asks. Store distribution still requires the platform's Apple Developer or Google Play account; that requirement is independent of the build tool.

## Useful commands

```bash
npx expo config --json
npx expo prebuild --no-install
npx expo run:android
npx expo run:ios
cd android && ./gradlew assembleRelease
cd android && ./gradlew bundleRelease
xcodebuild -version
fastlane --version
```

Do not invoke hosted build or submission commands implicitly. If the local platform toolchain is missing, report the exact missing prerequisite and stop at the furthest verified artifact.

## References

- Expo local builds: https://docs.expo.dev/guides/local-app-development/
- Android app signing: https://developer.android.com/studio/publish/app-signing
- Xcode archives: https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases
- fastlane: https://docs.fastlane.tools/
