# Expo UI migration

The app uses Expo ~57.0.23 and @expo/ui ~57.0.18 behind its source-owned UI interfaces. Expo Router continues to own native navigation and toolbars.

## Components

- Buttons, checkbox controls, selection chips and chat send/stop actions.
- Text inputs, textareas and the chat composer, including React Hook Form focus, validation and reset adapters; Android uses React Native inputs for accessibility.
- Native modal sheets for save-resource forms and add-to-cart confirmations.
- Native reasoning/tool disclosures in chat.
- Select/picker, switch and slider wrappers.
- Platform progress indicators, spinners and dividers.
- Expo UI's community bottom-sheet bridge for the shared imperative bottom-sheet/action-sheet interfaces.

The implementation uses the universal API where it exposes the required behavior. Android-specific buttons and pickers expose semantic colors, rounded shapes and full-width sizing. SwiftUI adapters supply tint and accessibility modifiers.

Rich markdown, selectable text, virtualized lists, commerce cards and responsive screen layouts retain their React Native/Uniwind implementation. These need behavior beyond the universal Text/ScrollView interface. No tabs, date fields or camera features were added simply to exercise additional exports. Unused registry components are not evidence that an app flow uses them.

## Design and layout

Uniwind's Tailwind v4 semantic tokens remain the source of colors and spacing. UIHost explicitly follows the current app color scheme and seeds native theme colors. Button/field styling uses consistent rounded corners and at least 56-point standalone targets. Responsive page widths and gutters remain owned by the surrounding app layout.

The initial emulator fixture exposed a mixed light/dark boundary and button labels wrapping inside stale intrinsic widths. Verification used the app's SafeArea adapter; native button width is constrained only when the caller supplies a flex/width layout. Native labels remain on one line.

Dialogs use Expo UI's community bottom-sheet adapter. Emulator testing reproduced a reopen failure with the universal BottomSheet after a programmatic close. The community adapter owns native mount/dismiss state and resets inherited scroll contexts. The dialog centers its React Native scroll content with an explicit width, capped at 640 points, to prevent intrinsic text widths from overflowing the native sheet. Centering also accounts for the Android bridge's window-wide React Native container on tablets.

## Input contract

On iOS, Expo UI TextInput uses native observable state. NativeInput bridges controlled strings to that state:

- Native edits reach the form's onChangeText.
- External resets synchronize the observable without emitting another user change.
- Delayed form echoes acknowledge native edits without overwriting newer native text.
- The native focus/blur ref is forwarded to React Hook Form.
- Validation labels and hints are attached to native fields.
- The composer retains send/stop behavior and a bounded multiline field.

Host keyboard avoidance is disabled for inline Android controls so the screen owns insets. Modal sheets own their own native keyboard behavior; their content is scrollable.

## Unmodified Expo UI

Expo UI uses the latest stable SDK 57 package (57.0.18), without a pnpm patch or build-from-source override. Recheck the registry's `latest` tag when upgrading; SDK 58's `next` package belongs to the preview SDK.

Android text inputs use React Native's supported text-input accessibility and keyboard APIs behind the existing NativeInput interface. Expo UI's stable BasicTextField does not expose custom accessibility labels. iOS retains the Expo UI observable-state adapter. Other Expo UI controls keep native rendering and use supported React Native host accessibility properties on Android.

AlertDialog calls the community modal's present/dismiss methods and dismisses the keyboard through React Native before changing presentation. Native package source remains unchanged.

## Verification history

The migration was checked with isolated control/form fixtures and automated tests that mocked Expo UI at the native module boundary. The fixtures, test suite and test tooling were subsequently removed. The production entry loads the crypto shim, CopilotKit polyfills and Expo Router.

## Verification results

See [the AniUI update notes](aniui-update.md) for verification of the unmodified Expo UI package and refreshed AniUI components. Earlier results from the patched build do not establish the behavior of the unmodified package.

The native fixtures used local callbacks for authenticated grocery operations. Server saves and cart additions require Clerk/runtime configuration. iOS native runtime behavior needs a simulator/device check.
