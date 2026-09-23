# Verification and remaining work

## Scope and environment

All 14 screen routes and the root layout were inspected individually, together with the domain chat, commerce, list, authentication, connection, sheet, and control components. The complete inventory and flow map are in `audit.md`; design decisions are in `design-system.md`. `index.html` is a local, interactive screenshot gallery. The later real-account rerun is documented in [live-verification.md](live-verification.md) and [live.html](live.html).

Native review used the Android `Codex_MCP_API_35` emulator, API 35, portrait, a locally built development client, and the installed Expo SDK 58 preview / React Native 0.88 release candidate. Default display: 1080×2400 at 420 dpi, about 411dp wide, font scale 1.0. Additional layout captures exercise a 320dp viewport at font scale 1.5 and an 800dp viewport. Light and dark appearances and reduced-motion system settings were exercised. Device settings are restored after review.

The original gallery uses **isolated local sample data**; the later `evidence/live/` captures use a real Clerk development session and the development gateway. `pnpm review:ui` copies the actual screens into a temporary workspace, replacing only the service/authentication providers there. The production app has no review-mode import or authentication bypass. The isolated review harness does not send grocery or account writes to the live backend. Its simulated authentication responses do not prove a real Clerk session; only the later live report does.

## Original isolated native review

| Journey                                                                                                              | Result                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home, chat, plan, saved lists, saved recipes, recipe, list editor, households, shared list, history, account, report | Opened and visually reviewed on Android.                                                                                                                                                                                                                       |
| Saved collection search                                                                                              | Entered a missing query, observed “No matching lists,” cleared search, selected Personal, switched to A–Z, and observed the single personal result.                                                                                                            |
| Collection lifecycle                                                                                                 | Captured distinct content, empty, loading, and failed-request screens. Empty/error calls to action use the shared layout.                                                                                                                                      |
| Shared shopping                                                                                                      | Added Apples, checked Chickpeas, observed progress change from 1/4 to 2/5 checked, opened removal confirmation, and kept the item.                                                                                                                             |
| Additional shared list                                                                                               | Created “Picnic” from the sheet, saw it become selected, and observed its empty state. The field, Create, and Cancel controls remain visible above the keyboard.                                                                                               |
| Recipe editing                                                                                                       | Changed the title, observed dirty status, canceled via “Keep editing,” observed an injected save failure, retried, and saw the saved title and success message in the reading view.                                                                            |
| Android Back                                                                                                         | With a dirty recipe, hardware Back now opens the discard/keep-editing alert. Nested authentication modes return to sign-in.                                                                                                                                    |
| Plan saving                                                                                                          | Submitted the save sheet to Maple House and observed a three-item saved list with household ID `home-1` and success feedback. Busy input values remain in the submitted payload.                                                                               |
| Cart confirmation                                                                                                    | Opened the confirmation for 2 matched products; it describes checkout and final-price responsibility. Canceled without executing a cart action.                                                                                                                |
| Authentication UI                                                                                                    | Switched sign-in/sign-up, submitted sample credentials through simulated responses, observed email verification and an incorrect-code error, and progressed through reset request/code to the new-password form.                                               |
| Report validation                                                                                                    | Submitted an empty report, observed the minimum-details validation and focused field, and retained the draft. No external email was sent.                                                                                                                      |
| Accessibility and typography                                                                                         | Inspected native labels and selected/checked states; verified minimum control sizes in the native hierarchy; observed wrapping at large text. Calculated core text/control/status contrast pairs exceed 4.5:1 in light and dark. See `evidence/contrast.json`. |

## Defects found during native review and fixed

- Native button measurement could squeeze action labels into narrow vertical columns. Chat footers, empty-state actions, and shared sheet footers now have explicit layout constraints; sheet actions use the actual window width.
- Compiler memoization retained React Hook Form’s initial form-state proxy. `useSubmitForm` opts out of that memoization so validation, dirty state, and submission feedback update.
- Passing the busy state into RHF’s `disabled` option removed values from the submitted payload. The form adapter now applies disabled state to editing/accessibility while preserving registered values.
- Recipe background resets cleared dirty status; they now preserve it. Reading/editing views also reset their scroll position when switching modes, with save feedback visible at the top.
- The live rerun found that CopilotKit’s XHR fetch fallback drops React Native `Request` bodies, causing valid household POSTs to fail. The entry point now restores Expo’s native streaming fetch after CopilotKit’s other polyfills. This also removes the fallback’s fixed 60-second timeout. Real create/update/delete requests pass afterward; long-running chat still has separate integration failures documented in the live report.
- Predictive Back enabled in this SDK/build bypassed JavaScript navigation handlers on Android. It is disabled in app configuration and verified in a rebuilt native client. This change requires a new native build; it cannot be delivered solely as a JavaScript update. Revisit predictive Back when the stack supports it reliably.

## Automated checks

- `npx @expo/agent-cli typecheck --json`: zero diagnostics.
- `pnpm lint`: Oxlint passes with warnings denied.
- `pnpm test`: 10 tests pass, covering duplicate-submit serialization and collection search/scope/sort behavior.
- `pnpm build`: Android and iOS production JavaScript exports.
- Android development client built and installed successfully after the Back configuration change.
- A final 20-second runtime observation window during clean-launch narrow-layout navigation reported zero errors. This is a bounded observation, not proof of error-free behavior across all flows; see `evidence/runtime-errors.json`.

The agent CLI lint wrapper invokes Expo/ESLint rather than this repository’s Oxlint command. Its attempted dependency changes were reverted; verification uses the repository’s existing `pnpm lint` script. The later user-requested upgrade moved `@copilotkit/react-native` from 1.72.0 through 1.73.2 to the current 1.73.3 release and aligned Expo SDK 58 dependencies to preview.5. The final lockfile passes `pnpm validate` with all 13 tests, and both platform exports pass. The detailed chat and collection journeys were captured on 1.73.2; the final 1.73.3 version was smoke-checked on the rebuilt Android client.

## Limits and follow-up validation

The initial review could not establish a live Clerk session. The subsequent rerun used the authenticated Clerk CLI to locate the existing development test account, completed a real password reset, and reached the signed-in app. Real backend persistence, household creation/joining, invite creation, shared-list creation and item mutations, recipe editing, personal-recipe isolation, history loading/resume, and Kroger authorization handoff were then exercised. Sign-up, verification/resend, sign-out, and password sign-in also completed against Clerk. See `live-verification.md` for exact results, account changes, and integration failures.

Generated-plan completion, broader server authorization, history pagination, Google SSO, completed Kroger authorization/cart writes, and external support/deletion/email destinations require additional integration validation. No orders or messages to other people were sent. The fixture results above do not validate server authorization or concurrency.

An iOS simulator/toolchain was unavailable, so iOS has TypeScript/export coverage rather than native interaction coverage. VoiceOver/TalkBack traversal and a physical-device performance pass remain outstanding. The SDK preview emits dependency/deprecation warnings. During development refreshes and Android display-setting changes, Expo Router also reported duplicate root/linking warnings; clean-launch behavior is assessed separately, and this should be rechecked in a release build.

Screenshots are unedited development captures and may include the development-tools overlay. Intermediate failed captures and raw component-tree dumps are excluded from the gallery. The audit is comprehensive at source/screen level; the limits above prevent a claim that every production integration is fully validated.

## Repeat the review

Run `pnpm review:ui`, open its Metro URL on the development client, and use `globalThis.__groceryReview.scenario(...)` through the agent runtime evaluator. Available scenarios include `content`, `empty`, `loading`, `error`, `connected`, `chat-error`, and `signed-out`. `failNext()` rejects the next local service request. Simulated auth codes accept `123456`; other values produce the invalid-code state. Stop Metro when done. The temporary workspace path is printed at startup.

## Save return follow-up — September 22, 2026

Successful recipe edits and list-title saves now return to the previous screen, with the corresponding saved collection as a fallback for direct entry. Save sheets opened from chat return to chat after success; sheets opened within a collection or grocery plan close in place. Failed saves retain the form and draft. This supersedes the earlier recipe-save behavior that stayed in the reading view.

On the Android API 35 development client, using the isolated screen harness:

- Edited a recipe title, pressed Android Back, chose Keep editing, then saved. The updated title appeared in Saved recipes without a discard prompt. [Capture](evidence/save-return/recipe-saved.png)
- Injected a list-title save failure and confirmed the draft and error remained visible. Retried successfully and returned to Saved lists with the updated title. [Failure](evidence/save-return/list-save-failed.png) · [Success](evidence/save-return/list-saved.png)
- Opened Save recipe and Save list from chat, completed each sheet, and returned to Plan in chat. [Recipe](evidence/save-return/chat-recipe-saved.png) · [List](evidence/save-return/chat-list-saved.png)

The first list retry exposed an Android native screen-stack mount exception followed by a Reanimated crash. List saving now finishes refreshing its data before navigating back. The final failure/retry sequence passed with no additional native crash. This bounded rerun does not establish general stability of the SDK preview.

Typecheck, repository lint, formatting, and whitespace checks pass. A final 20-second runtime observation reported zero JavaScript errors ([report](evidence/save-return/runtime-errors.json)). This follow-up used fixture data because the emulator could not resolve the development API hostname; live persistence and iOS interaction were not revalidated for this change.
