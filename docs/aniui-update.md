# AniUI update — September 15, 2026

Reviewed all 99 installed AniUI registry components against [upstream commit aa63bc0](https://github.com/anishlp7/aniui/commit/aa63bc0c115895557e3cf9e53c979aa244641d7b), using CLI release 0.7.1 as the registry version. Fifty components changed upstream since the app's July baseline; the other 49 were already current. The update merges the relevant source changes into the app's owned components.

## Changes

- Refreshed the six chart components: line, area, bar, pie, radar and radial. They now use Skia for rendering, animated data transitions and gesture-driven selection. Added Expo SDK 57's compatible `@shopify/react-native-skia` version, 2.6.2.
- Added AniUI's `useThemeColors` API backed by the existing Uniwind semantic tokens. Icons, chart labels, inputs and overlays follow the app's green theme and light/dark modes.
- Incorporated menu/popover safe-area positioning and trigger hit-area changes. Standalone actions retain `min-h-14` targets; Expo UI controls retain their native 56-point minimum.
- Incorporated waveform and streaming-cursor reduced-motion behavior, retaining the app's existing skeleton/typing animation cancellation.
- Added the React Native Reusables portal dependency and root `PortalHost` for the installed popup primitives.

The update preserves the Expo UI adapters, React Hook Form contracts, Expo Router navigation, grocery components and Tailwind v4 configuration. AniUI's initialization command was not run. New registry components were not added solely because they exist upstream.

`.aniui.json` records the reviewed upstream version and formatted-source hashes for all 99 installed components. These are comparison baselines; app-specific implementations intentionally differ from upstream. Do not replace these hashes with hashes of the customized files to hide those differences.

## Expo UI without patches

Expo 57.0.23 and Expo UI 57.0.18 were already the latest stable versions when checked. SDK 58's `next` packages are preview releases. Removed the Expo UI pnpm patch, its lockfile references and the Android build-from-source override. The installed package and native build use the unmodified release.

The old patch added Android accessibility semantics and changed native modal keyboard focus. Those responsibilities now live in the app:

- Android buttons, checkboxes, switches and sliders expose accessibility labels/state through React Native hosts while retaining Expo UI rendering. Sliders support increment/decrement accessibility actions.
- Android fields use React Native `TextInput`, because stable Expo UI `BasicTextField` does not expose custom accessibility labels. The shared field interface and React Hook Form adapters remain unchanged.
- iOS fields keep Expo UI's native observable adapter, including protection against delayed controlled-value echoes.
- Save dialogs dismiss the keyboard through React Native before native sheet presentation changes.
- Android portal popups use a transparent React Native modal for focus isolation and predictive Back dismissal. This fixes Back exiting the app while a popover is open.

## Verification

Isolated fixtures exercised charts, menus, theme tokens, reduced-motion visuals, the save form and shared native controls without authentication. The fixtures and automated test suite were subsequently removed at the user's request. The production entry loads the crypto shim, CopilotKit polyfills and Expo Router.

Native verification used an Android API 35 arm64 emulator and a fresh debug APK built against the current dependency lockfile, with unmodified Expo UI and Skia. Checks covered:

- All six charts with two data sets, empty data and restored data; line-chart gesture selection.
- Popover opening, closing, reopening and Android Back; dropdown menu selection.
- Save-sheet title editing, saving, keyboard dismissal, default-value restoration and Android Back.
- Native checkbox/switch interaction and checked accessibility states, slider dragging, picker selection, and React Hook Form required-field validation/submission.
- Dark and light themes, reduced motion, a 320-point narrow layout and an 800-point wide layout.

The production entry was restored after fixture testing. The removed automated native-module mocks checked form/domain behavior, but did not establish native rendering or screen-reader behavior.

Checks passed before removal of the test suite:

- `pnpm validate`: type-aware oxlint with no warnings, oxfmt across 260 files, strict app/test TypeScript checks, 98 tests across 26 files, and Expo dependency compatibility.
- `pnpm build`: Android and iOS production JavaScript/Hermes exports.
- `expo-doctor`: 21 of 21 checks.
- Android `:app:assembleDebug` with the current native dependencies.

Current validation uses `pnpm validate` for type-aware lint, formatting, strict TypeScript checks and Expo dependency compatibility, plus `pnpm build` for both platform exports. Tests and coverage are no longer part of the validation workflow.

Authenticated server saves/cart operations and iOS device/simulator behavior require separate runtime verification. Accessibility hierarchy checks do not replace a TalkBack session.
