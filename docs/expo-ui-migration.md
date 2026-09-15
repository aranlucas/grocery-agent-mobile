# Expo UI migration

The app uses Expo ~57.0.23 and @expo/ui ~57.0.18 behind its source-owned UI interfaces. Expo Router continues to own native navigation and toolbars.

## Components

- Buttons, checkbox controls, selection chips and chat send/stop actions.
- Text inputs, textareas and the chat composer, including React Hook Form focus, validation and reset adapters.
- Native modal sheets for save-resource forms and add-to-cart confirmations.
- Native reasoning/tool disclosures in chat.
- Select/picker, switch and slider wrappers.
- Platform progress indicators, spinners and dividers.
- Expo UI's community bottom-sheet bridge for the shared imperative bottom-sheet/action-sheet interfaces.

The implementation uses the universal API where it exposes the required behavior. Android-specific buttons and pickers expose semantic colors, rounded shapes and full-width sizing. SwiftUI adapters supply tint and accessibility modifiers.

Rich markdown, selectable text, virtualized lists, commerce cards and responsive screen layouts retain their React Native/Uniwind implementation. These need behavior beyond the universal Text/ScrollView interface. No tabs, date fields or camera features were added simply to exercise additional exports. Unused registry components are not evidence that an app flow uses them.

## Design and layout

Uniwind's Tailwind v4 semantic tokens remain the source of colors and spacing. UIHost explicitly follows the current app color scheme and seeds native theme colors. Button/field styling uses consistent rounded corners and at least 56-point standalone targets. Responsive page widths and gutters remain owned by the surrounding app layout.

The initial emulator fixture exposed a mixed light/dark boundary and button labels wrapping inside stale intrinsic widths. The fixture now uses the app's SafeArea adapter; native button width is constrained only when the caller supplies a flex/width layout. Native labels remain on one line.

Dialogs use Expo UI's community bottom-sheet adapter. Emulator testing reproduced a reopen failure with the universal BottomSheet after a programmatic close. The community adapter owns native mount/dismiss state and resets inherited scroll contexts. The dialog centers its React Native scroll content with an explicit width, capped at 640 points, to prevent intrinsic text widths from overflowing the native sheet. Centering also accounts for the Android bridge's window-wide React Native container on tablets.

## Input contract

Expo UI TextInput uses native observable state. NativeInput bridges controlled strings to that state:

- Native edits reach the form's onChangeText.
- External resets synchronize the observable without emitting another user change.
- Delayed form echoes acknowledge native edits without overwriting newer native text.
- The native focus/blur ref is forwarded to React Hook Form.
- Validation labels and hints are attached to native fields.
- The composer retains send/stop behavior and a bounded multiline field.

Host keyboard avoidance is disabled for inline Android controls so the screen owns insets. Modal sheets own their own native keyboard behavior; their content is scrollable.

## Android native patch

Expo UI 57.0.18's Compose semantics modifier exposes only autofill contentType. A small versioned pnpm patch adds contentDescription, stateDescription, validation error, selected, checked and role properties. The shared accessibility adapter uses them on the actual native control instead of an inert React Native parent.

The patch also dismisses the keyboard before hiding a native modal sheet, using its still-attached dialog window, and clears restored text-editor focus when the activity regains its window. AlertDialog calls the community modal's native present/dismiss methods so the close animation and keyboard cleanup finish before unmounting. Without this sequence, saving an edited title could leave the keyboard covering controls on the underlying screen even after the sheet was removed.

The package's precompiled Android artifact does not contain this patch. package.json therefore configures expo.autolinking.android.buildFromSource with expo-ui. Keep this setting with the patch. Rebuild native binaries after changing the patch; a Metro reload cannot update Kotlin.

When upgrading Expo UI, check whether upstream supports these semantics, remove the patch if appropriate, and repeat native accessibility verification. The new binary is required; Expo Go cannot validate this patched native behavior.

## Native verification fixture

test/native-ui-preview.tsx is an isolated control/form fixture without network or authentication. It is not imported by the production entry. To inspect it locally, temporarily point index.js at that fixture, run the Android development build with Metro, and restore index.js afterward. Never commit the fixture entry in index.js.

Automated tests mock Expo UI at the native module boundary to exercise the app's form and domain contracts. They do not prove native layout, accessibility or keyboard behavior. See the verification results below.

## Verification results

Expo's dependency compatibility check and all 21 Expo Doctor checks passed after updating to 57.0.23. `pnpm check`, all 94 tests in 25 files, and actionlint passed. `pnpm build` produced and verified both Android and iOS production JavaScript/Hermes exports using the restored production entry. The Android arm64 native development APK also compiled successfully with the patched Expo UI source module.

Android API 35, arm64 development APK, with the patched Expo UI module compiled from source:

- React Hook Form required-field validation, native typing, and submitted values.
- Save-resource popup opens, saves the edited title with the keyboard visible, closes, and reopens with its default title restored.
- Cancel, Android Back and tapping the scrim dismiss the popup; it can be opened again after each path.
- Native store dropdown selection, checkbox and switch state changes, and expanded disclosure text wrapping.
- Native accessibility hierarchy includes field and button labels, checkbox state, selection state and a labelled slider. This is hierarchy inspection, not a full TalkBack usability session.
- Light and dark appearance, including a 320-point-wide phone with the keyboard visible and Android animations disabled.
- An 800-point-wide tablet layout keeps the popup title, field and actions inside a centered 640-point native sheet.

The fixture uses the real SaveResourceDialog but substitutes a local confirmation callback. Authenticated grocery gateway operations require Clerk/runtime configuration unavailable in this checkout; server saves and cart additions were not exercised against a live account. iOS native runtime behavior still needs a simulator/device check.
