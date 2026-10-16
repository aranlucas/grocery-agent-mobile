# Expo SDK 58 verification — 16 October 2026

Verified the SDK 58 migration from commit `42fa4d2` with the corrections in this worktree. The app uses Expo 58.0.14, React Native 0.88.0, React 19.3.0, and Clerk Expo 4.13.0.

## Corrections

- Use React Native's `TextInputInstance` for the Android input ref. The old `TextInput` type no longer exposes instance methods under React Native 0.88.
- Resolve `expo/tsconfig.base.json` explicitly so Vite/Vitest can load the inherited configuration.
- Rename `expo.agentCli` to `expo.agent-cli`, as required by the installed agent CLI.
- Match `react-test-renderer` to React 19.3.0.
- Remove the obsolete `enableSceneSupport` setting; SDK 58 supplies the scene lifecycle automatically.
- Support Clerk's email-code second-factor/device-trust step after password authentication, including incorrect-code errors, resend cooldown, changing the email, and session finalization. The fresh development account previously stopped at the generic additional-verification error.
- Refresh the generated SDK guidance and README.

## Dependency overrides

No dependency overrides or package patches are configured. The Router regression now exercises SDK 58's actual query parser and asserts that the removed `query-string` and `decode-uri-component` dependencies are absent.

The Xcode regression checks the actual generation of unique 24-character project IDs. Xcode 3.0.1 still brings UUID 7.0.3, so dependency scanners may flag it. Its installed implementation calls `v4()` without an output buffer; the [UUID advisory](https://github.com/uuidjs/uuid/security/advisories/GHSA-w5hq-g745-h8pq) concerns buffer bounds in `v3()`, `v5()`, and `v6()`. Removing the override does not upgrade that transitive package.

## Checks

- Typecheck, Expo lint and Tailwind lint, formatting, and `git diff --check`: pass.
- Vitest: all 39 tests in 7 files pass.
- Expo dependency compatibility: pass.
- Expo Doctor: all 20 checks pass.
- Android and iOS production exports: pass after the authentication fix.

## Android native observations

Built and installed a fresh development APK on `Agents_Android_17_API_37_2`, Android 17, arm64, 16 KB pages. Gradle completed successfully.

- Startup and the signed-out form render correctly.
- Native text input, software keyboard visibility, password-field focus, reset/sign-up disclosure, and Android Back were exercised.
- Light appearance at 1080×2400 / 420 dpi, dark appearance at approximately 320 dp and 800 dp widths, and reduced motion were checked. The wide form remains centered; narrow actions stack and the screen scrolls.
- A fresh `+clerk_test` user was created with the Clerk CLI in the existing Agents development instance, as requested. An incorrect email code was rejected; `424242` completed the real sign-in flow and opened Home.
- A streamed “Reply with Ready.” request returned “Ready.” and restored the idle composer.
- The authenticated session survived an app restart. Account rendered the new user's identity; sign-out returned to the form; a returning password sign-in reached Home.
- Runtime error collection reported no errors in an 8-second window after restart/navigation and a final 4-second window after returning sign-in. These are bounded observations, not a claim about all possible flows.

Display size, appearance, animation scale, and hardware-keyboard settings were restored. The emulator was already running before this verification.

## iOS native observations

The generic Debug simulator build succeeded with 0 errors and 9 warnings using Xcode 27.1. The built app is `/tmp/grocery-expo58-ios-build/GroceryAgent.app`. It was installed and launched on iPhone 18 Pro / iOS 27.0.

- Startup rendered the real Clerk sign-in form.
- Native SwiftUI email and password fields accepted the QA credentials. The submit button remained reachable by scrolling with the software keyboard open.
- Password authentication displayed the email-code step; `424242` completed sign-in and opened the authenticated Home screen with the QA user's name.
- XCTest code entry was retried with an 80 ms character delay after its initial read-back contained only the first digit. The retried field contained all six digits before submission.
- Home and the native navigation header were checked in light and dark appearance at 402×874 points. Appearance was restored afterward.
- Runtime error collection reported no errors in an 8-second startup window or a 4-second post-sign-in window.

The normal device-targeted CLI build requires a development certificate because the Clerk plugin adds the Apple sign-in entitlement, including for simulators. The local verification uses `npx @expo/agent-cli run:ios --device generic --no-bundler --output /tmp/grocery-expo58-ios-build` to build without certificate provisioning.

The temporary iOS simulator and Metro servers were stopped after verification. Both native development builds remain installed; the generic iOS app and Android debug APK remain available locally.

## Scope and remaining observations

- Gateway 404 responses were excluded from further investigation at the user's request. This report does not certify household/list persistence or other excluded backend flows.
- Metro emits an upstream Sentry optional-import warning for Expo Router's removed `global-state/router-store` path. Both bundles export; Android startup and chat work. Sentry routing telemetry was not independently verified.
- Verification uses development accounts and local simulator/emulator builds. No store upload, signed release archive, purchase, cart write, or message to another person was performed.
- The new development QA account remains available. Its randomly generated password is stored only in the local temporary QA credentials file, outside the repository.
