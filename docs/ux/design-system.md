# Grocery Agent design system

The app keeps its forest-green identity and native Expo controls. The visual language is shared by authentication, planning, the library, household collaboration, and account surfaces.

## Tokens

| Foundation | Decision                                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color      | Semantic `background`, `card`, `foreground`, `muted`, `primary`, `secondary`, `border`, `input`, and `destructive` tokens. Added `primary-surface`, `success`, and `success-surface` for readable tinted surfaces in both appearances. |
| Typography | Explicit pixel tokens avoid the Metro 14px rem conversion: 28px introduction, 22px section, 18px card title, 16px body, 14px secondary text, 12px compact metadata. Normal body line height is 24px.                                   |
| Spacing    | A 4px unit; 16px phone and 24px wide gutters. Content centers within `max-w-3xl`. Auth forms use a narrower column.                                                                                                                    |
| Corners    | 8px small, 12px controls, 16px cards, 24px special surfaces. Continuous corners where supported.                                                                                                                                       |
| Elevation  | Borders and surface colors establish grouping. No decorative shadows, gradients, or glass layers.                                                                                                                                      |
| Touch      | Standalone controls have a minimum 56×56 target. Native Android buttons can grow vertically with text. iOS button height scales with system font size.                                                                                 |
| Icons      | Existing Lucide set. Paired with visible labels for domain actions; icon-only actions carry accessibility labels.                                                                                                                      |

## Shared patterns

- **NavigationRow:** grouped destinations with a title, supporting line, optional icon, chevron, and consistent touch area. Used on Home, Account, and saved collections.
- **CollectionToolbar:** search with a clear action; All, Personal, and Household scope; recent/alphabetical sorting. Empty collections, no search results, failed requests, and refreshes remain distinct.
- **ListProgress:** remaining count, checked count, and a progress bar with an accessible value. Lists expose checked state through both a native checkbox and text treatment.
- **ErrorState / Alert / EmptyState:** named recovery action, readable explanation, consistent spacing. Success feedback uses a check and text rather than color alone. Background failures can appear alongside existing content.
- **FormInput / FormTextarea:** visible labels, native focus handling, validation messages, disabled/busy state, shared React Hook Form submission guard. Busy controls preserve their payload values. The shared hook opts out of compiler memoization because RHF replaces its form-state proxy between renders.
- **Native sheets:** consistent title, explanation, labeled fields, wrapping destination choices, and footer actions. In-flight saves disable dismissal and repeat submission. Recipe and item-removal confirmations use native alerts.
- **Screen / headers:** Expo Router owns headers, toolbar actions, route transitions, and modal presentation. Screen content handles responsive gutters, scrolling, and keyboard layout.
- **Disclosure:** meal plans, deals, and technical details stay available without competing with the primary task.

The app does not introduce a new tab bar, toast framework, profile editor, or in-app checkout. Existing domain behavior stays in Clerk, CopilotKit, grocery, and Kroger components.

## Product behavior

Home prioritizes planning and the active list. Saved recipes open in a reading view, with editing as an explicit action. Saving recipe edits or a list title returns to the screen that opened the editor, with the saved collection as the fallback for direct entry. Saving from a chat-initiated sheet returns to chat; opening that sheet within a plan or collection closes it in place. Failed saves retain the draft. A saved recipe can seed a chat prompt without sending it automatically. Collections share find/filter/sort behavior. Shared lists offer another-list creation after the first list exists. Household creation and joining are separate intentions. Cart confirmation states the number of matched products and any available estimate before starting the action.

Authentication now includes password visibility, reset-code recovery, resend, and email correction. These paths preserve the installed Clerk SDK integration. See `verification.md` for the distinction between observed native behavior and live service validation.
