# Real-account verification — 22 September 2026

This rerun uses the production app code with a real Clerk **development** session and the Railway **development** gateway. It follows the original isolated UI review. The two evidence sets are intentionally labeled separately: `index.html` contains the original sample-data review; `live.html` contains real-account captures.

## Configuration and upgrade

- The already-authenticated Clerk CLI located the existing development test account `codex.grocery+clerk_test@example.com`. It has no configured username or display name.
- The app completed a real reset-code flow: an incorrect code was rejected, Clerk’s development test code was accepted, a new random password was set, and the app entered Home. This was not an authentication bypass.
- The ignored `.env.local` selects the development Clerk publishable key and `https://agents-gateway-development.up.railway.app`. No Clerk secret key is embedded in the app or tracked in this worktree.
- At the user’s request, `@copilotkit/react-native` was upgraded from **1.72.0 to 1.73.3**, the current latest release, using `npx @expo/agent-cli install`. The app’s Expo SDK-compatible dependencies were aligned to SDK **58.0.0-preview.5**, and the managed skill index was refreshed. The Android development build and both production exports were rebuilt against the final versions.
- A second explicitly named development test account, `codex.grocery.member.20260922.1113+clerk_test@example.com`, was created through the sign-up UI for cross-account checks.
- Android API 35, 1080×2400 at 420 dpi, dark appearance, font scale 1.0, reduced-motion settings. The live rerun also covered the persisted recipe at 320dp/150% text in light appearance; the earlier isolated review additionally covered 800dp layouts. iOS has export coverage only.

## Fetch integration defect and fix

A real household-creation request failed with HTTP 400 `invalid_grocery_request`. Passive request tracing showed the JSON body was missing. `openapi-fetch` passes a React Native `Request`; CopilotKit’s XHR fallback reads `Request.body`, while that request implementation stores the payload in `_bodyInit`.

The original 1.72.0 package and the current 1.73.3 package both install an XHR-based streaming-fetch shim; in 1.73.3 the polyfill barrel calls `installStreamingFetch()`, which replaces `global.fetch`. The app imports `src/shims/native-fetch.ts` immediately after CopilotKit’s polyfills, restoring `expo/fetch` before API clients are created. Expo handles the React Native request body and provides native response streaming. The other CopilotKit polyfills remain loaded.

Household/list creation and subsequent update/delete requests succeeded after this change. Removing the XHR fallback does **not** establish that every long-running chat is healthy; the separate failures below remain material.

## Live observations

| Journey                          | Observed result                                                                                                                                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clerk reset and sign-in          | Wrong reset code rejected; correct development code accepted; new password completed the real Clerk session.                                                                                                                                       |
| Password sign-in/sign-out        | Native Sign out returned to the sign-in screen. Submitting the test account and its reset password signed in again and opened Home.                                                                                                                |
| Sign-up and email verification   | Created the second test account, rejected an incorrect code, resent successfully with a cooldown, and completed verification using Clerk’s development test code. The account reached its empty household view.                                    |
| Session restoration              | Session survived app/emulator restart and the CopilotKit upgrade; persisted data reopened afterward.                                                                                                                                               |
| Household creation               | Created `Grocery QA 20260922` through the native form; server returned 201 and subsequent GET returned the household with the test user as owner.                                                                                                  |
| Invite creation/sharing          | Created a real development invite and opened the native share chooser. Dismissed without selecting a recipient or sending a message.                                                                                                               |
| Household joining                | The second account joined using the real invite code. The screen displayed Member and a successful join message; owner-only invite controls were absent. The member opened the shared-list screen and read both QA Weekend and QA Groceries.       |
| Personal recipe access           | Opening the owner’s personal recipe under the member account produced HTTP 404 and no recipe data, confirmed in the query result. The generic missing-item copy was corrected because the gateway used a list-oriented error code for recipes too. |
| Shared-list creation             | Created `QA Groceries`, then `QA Weekend` through the additional-list sheet. The new list became selected, and keyboard-visible form controls remained usable.                                                                                     |
| Shared-list items                | Added Apples, checked it, observed completed progress, and removed it through the native confirmation. The POST/PATCH/DELETE operations succeeded.                                                                                                 |
| Saved collections                | Pull-to-refresh loaded the persisted lists. A missing search displayed the no-results state; Clear filters recovered content; Personal selected the personal list.                                                                                 |
| Personal list editing            | Changed the title to `QA Personal Pantry Reviewed`, exercised dirty Back/Keep editing, saved, and checked Rice. Fresh API reads confirmed the title and checked timestamp.                                                                         |
| Recipe editing                   | Reopened the live recipe after the upgrade, changed its title, exercised Android Back/Keep editing, and saved. Reopening and a fresh API read both showed `QA Chickpea Spinach Skillet Reviewed`.                                                  |
| Chat history/resume              | History listed all three earlier conversations. Opening “Reply with Ready.” restored the completed assistant response “Ready.” on CopilotKit 1.73.2.                                                                                               |
| Generation/stop/retry            | Streaming reasoning appeared. Stop and new-chat controls were exercised. Longer recipe requests failed; the visible Retry action was exercised and also encountered a stream failure.                                                              |
| Kroger handoff                   | Connect Kroger opened the real authorization page. Closing its browser returned to the app. Opening the incomplete callback route produced the error state; Back to account recovered. Authorization was not completed.                            |
| Fresh short generation on 1.73.2 | After the failed recipe request, New chat and a fresh “Reply with Ready.” request produced “Ready.” and returned the composer to its idle Send state.                                                                                              |
| Offline/reconnect                | Disabling Wi-Fi and cellular data produced the saved-recipes offline state. Restoring connectivity automatically loaded the persisted recipe without manually retrying.                                                                            |
| Large text and light appearance  | Reopened the persisted recipe at 320dp width and 150% font scale in light mode. Title, metadata, ingredients, and instructions wrapped within the viewport.                                                                                        |

The personal list and initial recipe were **seeded through the actual authenticated app API** to exercise their native editors while generation was failing. Their creation was not a successful generated-plan save-sheet test. Household/shared-list creation and the editing/item actions above used the native UI. Expo runtime tools were used for selected authentication fields and final chat submissions; other interactions used native accessibility labels and Android input events.

## Kroger credential follow-up — September 22, 2026

At the user's request, the Bitwarden CLI was used to locate Kroger/QFC credentials. The QFC developer entry was rejected by Kroger's consumer login. The main QFC entry was accepted, and the OAuth browser returned to the native app. The vault was also synced. Credentials were supplied directly to the Kroger login page without adding them to project files.

Clerk rejected the main QFC login link to the separate QA user with `oauth_identification_claimed`: the OAuth email already belongs to another development user. A targeted lookup confirmed that its existing development account already has a verified `oauth_custom_shopping` connection. That association was preserved.

To test a separate signup, a one-use disposable inbox was created with [Mail.tm](https://mail.tm/), and its login was stored in Bitwarden. Kroger accepted the new address, sent a verification code, and the signup completed through the Kroger authorization screen. The Kroger credentials are stored in the Bitwarden item `Kroger - Grocery Agent QA (2026-09-22)`; the inbox is in `Mail.tm - Grocery Agent QA (2026-09-22)`. Clerk reports a verified `oauth_custom_shopping` connection on the existing Grocery Agent development QA user. The consent screen requested profile read, product read, and cart add permissions. A fresh native user reload then displayed “Connected · Live prices and cart access” on Account ([capture](evidence/live/kroger-connected.png)). This verifies link visibility; no cart operation or purchase was made, so cart access has not been exercised end to end.

The app previously replaced this provider error with a generic connection failure. Both the callback and Account screen now explain that the Kroger email is registered to another Grocery Agent account and direct the user to sign into that account. Callback polling stops on a definitive provider error while continuing for pending verification; unrelated provider errors do not interrupt it. Both messages were verified on Android ([callback capture](evidence/kroger/account-conflict.png)). Typecheck, lint, formatting, and all 13 tests pass, including three connection regressions.

The emulator continued reporting a development-gateway DNS failure even though the Clerk and Kroger authorization pages were reachable. Cart operations remain unverified.

## Integration failures and remaining coverage

- The development gateway reported `provider groq failed for model openai/gpt-oss-120b (response_schema)` on recipe requests. This was observed before and after the dependency upgrade.
- A stopped run produced a server-side cancellation panic: `range function continued iteration after function for loop body returned false`.
- With Expo fetch, a long run failed with `Software caused connection abort` during the browser-handoff review. A foreground retry failed with `stream was reset: CANCEL`. CopilotKit displayed Retry, but the development runtime also reported an unhandled promise rejection. Root cause of those transport failures is not established. A new gateway development build was observed during the rerun; it was not triggered by this task.
- After the new development gateway deployment (`61a698b4-1bc5-4bc7-b340-f6cc9372313a`), a clean-start foreground recipe request returned a structured `RUN_ERROR` with code `provider_response_schema`. The app restored the submitted prompt and exposed Retry. Gateway logs confirmed the model-provider error for run `ece9ad20-8ed0-43ed-85ec-133af80d33a4`. This final attempt delivered a backend error through the stream rather than completing a recipe.
- A short chat response and history restoration are verified. Completed recipe generation, resulting plan state, save-from-generated-plan, history pagination, cart writes, and server-side concurrency are not yet verified end to end.
- Broader server-side authorization and concurrency, Google SSO, support/email destinations, deletion requests, and native iOS interactions remain outside the completed live observations. No cart writes, purchases, messages to other people, or account deletion were performed.
- Changing Android display/appearance settings while attached to Metro reproduced the previously observed duplicate-root/linking development warning. Clean startup is assessed separately.
- Screen-reader traversal and physical-device performance remain outstanding. Development captures include tools/log overlays when present; they are not edited screenshots.

## Final checks on CopilotKit 1.73.3 and Expo SDK 58 preview.5

- `pnpm validate`: **passes** (lint, formatting, typecheck, all **13 tests**, Expo dependency compatibility).
- `pnpm build`: **passes** (Android and iOS JavaScript exports).
- `npx @expo/agent-cli dev --android`: **passes**, including Gradle build and development-client install.
- The rebuilt Android development client loaded the existing signed-in QA session. Account showed **Connected · Live prices and cart access**, and the final **2-second runtime-errors window reported no errors**.
- The detailed chat, household, collection, and edit journeys above were run on CopilotKit 1.73.2 before the final patch update. The final 1.73.3 build was checked through native startup, Clerk/Kroger connection display, Android build, and both platform exports.
- Real native reads, POSTs, updates, and deletion: **observed as described above**.

The original clean runtime window in `verification.md` belongs to the isolated review. It does not supersede the live integration errors recorded here.

## Local review state

The ignored local configuration remains pointed at development for further review. The two QA accounts and clearly named QA household/list/recipe records remain in development. No production data was changed. Temporary Metro and emulator processes were stopped after verification; display, font, animation, appearance, and network settings were reset first.
