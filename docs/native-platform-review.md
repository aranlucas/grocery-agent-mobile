# Native platform review

Reviewed September 15, 2026. Ferran's [post and replies](https://x.com/ferrannp/status/2098850443510292724) were read in Chrome and checked against the repository and primary documentation. This review does not establish a measured performance improvement.

## What applies to this app

| Recommendation                               | Evidence in this app                                                                                                                                                                                        | Decision                                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Native navigation, screens, headers, symbols | Expo Router Stack, react-native-screens, native Stack toolbars, SF Symbols and Material Symbols. The routes form one flat stack.                                                                            | Keep. Ferran [explicitly accepts Expo Router](https://x.com/ferrannp/status/2099500157746168259).              |
| Native UI controls and sheets                | Shared controls now use Expo UI; save-resource and cart-confirmation dialogs use native modal sheets.                                                                                                       | Implemented. See [migration notes](expo-ui-migration.md).                                                      |
| Native tabs and formSheet routes             | The app uses a stack and a modal report route; it has no tab navigation.                                                                                                                                    | Add only when the navigation hierarchy needs them. Native controls do not require adding tabs.                 |
| Fine-grained subscriptions                   | The agent hook separates status, state and message subscriptions, throttles updates to 50 ms, and stabilizes references. Its provider still publishes a combined context and always enables thread loading. | Profile and narrow subscriptions before replacing the store.                                                   |
| Stop offscreen work                          | Household/shared-list queries use focus cleanup. Session polling stops in background. Saved-resource and agent display subscriptions are not all gated by screen focus.                                     | Remaining optimization: scope display work to screen focus, while preserving intentional in-flight operations. |
| Nonblocking startup                          | Clerk loading and the initial Copilot session token gate the whole navigation stack. Copilot polyfills load in the entry file.                                                                              | Remaining optimization: measure cold starts and separate shell readiness from session readiness.               |
| MMKV / Nitro                                 | No general-purpose local key-value store. Clerk uses SecureStore-backed caches.                                                                                                                             | No storage migration without a persistence requirement.                                                        |
| SQLite / Drizzle                             | Server data is managed with TanStack Query; there is no offline relational store.                                                                                                                           | Conditional on an offline feature.                                                                             |
| Inline requires                              | Installed Expo Metro production defaults have inlineRequires false. Entry imports include ordering-sensitive crypto and Copilot polyfills.                                                                  | Benchmark a targeted change; do not globally flip it without startup validation.                               |
| react-native-ease                            | Reanimated remains for existing custom animations. Expo UI owns native control/sheet animations.                                                                                                            | No extra animation library needed for this migration.                                                          |

The focus-cleanup recommendation comes from [Sami's reply](https://x.com/TheXSami/status/2098871925401342108). [Andrei's reply](https://x.com/Andrei_Calazans/status/2098888582781956488) discusses flat navigation, static screens, measurement, inline requires and ease; Ferran [endorses ease](https://x.com/ferrannp/status/2098888987297337502). Ferran also [accepts OP-SQLite](https://x.com/ferrannp/status/2099500266127040874). Replies mentioning VisionCamera do not establish a camera requirement for this grocery app.

## Research findings

### Navigation and lifecycle

Native stack transitions run on the native UI thread, reducing dependence on JavaScript frame work. This app already uses the appropriate stack. Evaluate release builds, because development mode adds overhead. [React Native performance guide](https://reactnative.dev/docs/performance)

A pushed screen may remain mounted. Use focus-effect cleanup for screen-owned work; a blur listener alone can miss unmount paths. Query enabled flags stop automatic fetching but do not necessarily remove all subscriptions, so separately assess fetch activity and render notifications. [React Navigation useFocusEffect](https://reactnavigation.org/docs/use-focus-effect/)

### Startup

The actionable idea is to minimize work before usable content appears. Android 12+ supplies a system splash screen; “no splash” is not a literal platform requirement. Avoid extending splash/loading states while unrelated network work finishes. Keep authentication checks in place for protected data/actions. [Android splash screens](https://developer.android.com/develop/ui/views/launch/splash-screen)

Lazy module loading can defer JavaScript evaluation. Inline requires can also change initialization order, which matters for this app's crypto shim and Copilot polyfills. Test a cold start, deep links and sign-in transitions after any bundler change. [React Native JavaScript loading](https://reactnative.dev/docs/optimizing-javascript-loading)

### Expo UI

The installed SDK recommends @expo/ui ~57.0.18. Its universal controls use SwiftUI on iOS and Jetpack Compose on Android, with separate platform APIs for capabilities the universal interface does not expose. Host sizing, native observable input state and platform modifiers need explicit adapters. Native controls still need deliberate typography, spacing, colors and accessibility. [Expo UI](https://docs.expo.dev/versions/latest/sdk/ui/), [universal API](https://docs.expo.dev/versions/latest/sdk/ui/universal/)

### MMKV and Nitro

MMKV v4 uses Nitro Modules and offers synchronous key-value reads/writes. That can suit small preferences or drafts, but its storage microbenchmark is not evidence that this app launches faster. Encryption is optional; its README says defaults store plaintext. Keep Clerk's secure credential cache and define per-user cleanup before introducing any general-purpose cache. [MMKV README](https://github.com/mrousavy/react-native-mmkv), [v4 migration guide](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/V4_UPGRADE_GUIDE.md)

Nitro supplies native bindings for modules written in C++, Swift or Kotlin. Installing it does not automatically optimize JavaScript rendering or networking. Adopt it when a required library uses it or a measured native integration needs it. [Nitro repository](https://github.com/mrousavy/nitro)

### SQLite and Drizzle

Expo SQLite persists a relational database across restarts and documents a Drizzle integration. It is a reasonable option for a deliberate offline grocery-list feature. Schema migrations, queued writes, conflict resolution and account cleanup would be product work; adding SQLite alone does not make the existing server flows offline-capable. [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)

### Legend State and animations

Legend State offers tracked observables and fine-grained updates. Its guidance emphasizes batching writes and tracking items at the child boundary. Version 3's migration guidance favors useValue for React subscriptions. Those principles are useful here, but there is no measured basis yet to replace TanStack Query or the Copilot-owned agent state. [Legend performance](https://legendapp.com/open-source/state/v3/guides/performance/), [migration guide](https://legendapp.com/open-source/state/v3/other/migrating/)

react-native-ease wraps platform animation APIs for declarative animations. It is worth evaluating for isolated transitions, while gesture-driven/interactive animation needs still warrant separate consideration. This migration already removes custom dialog/disclosure animations from active flows in favor of native Expo UI behavior. [react-native-ease repository](https://github.com/AppAndFlow/react-native-ease)

## Remaining priorities

1. Measure release cold start and screen transitions on a representative device.
2. Make the navigation shell independent of Copilot session initialization.
3. Narrow screen-owned subscriptions and saved-resource fetching.
4. Profile chat, home and list renders before a state-library change.

The APK publishing workflow is separate from these optimizations: it runs manually, builds the production APK, and attaches the APK and SHA-256 checksum to a GitHub Release.
