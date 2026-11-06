# Correctness and reliability audit — 2026-11-06

Baseline: remote `origin/main` = `4e6f4773a1f4d8a7b9ce4f3672d96cbca571dfd2` (merged domain untangle). Worktree was clean. This is a behavior audit, not a structural refactor. All tests and builds run in CI only.

## Inventory and boundaries

- Expo Router screens: sign-in/sign-up/reset/MFA, chat/history, generated shopping plan/recipe, saved lists/recipes, household create/join/invites/shared editing, account/Kroger connection, problem reporting.
- Clerk owns sessions and OAuth; SecureStore/resource cache restore sessions. `runAuthenticated` refreshes tokens before requests, refuses missing sessions, and checks cancellation after refresh. Household HTTP uses typed `openapi-fetch`; backend authorization remains a server responsibility.
- TanStack Query keys include user and household/resource identity. Shared list mutations invalidate detail and collection views. Mutations do not retry automatically; single-submit forms serialize keyboard/button submission. No local persisted grocery database or client transactions.
- Copilot operations serialize transitions, restore snapshots after failures, distinguish cancellation, filter unrelated thread errors, and release subscriptions. Agent state and replay messages are untrusted serialization boundaries.
- Kroger uses an external auth session; its owner consumes the rotating nonce while the callback polls with bounded delay and abort cleanup. Cart transfer asks confirmation and leaves checkout to Kroger.
- Scripts/config/plugins cover unsigned simulator pilot, signed APK release, runtime endpoint selection, Kotlin runtime, UI review. CI already runs lint/format/type/unit/dependency/export gates. Release workflows require explicit dispatch; no release/deployment is authorized here.

## Confirmed findings (recorded before implementation)

1. **High confidence, medium impact: malformed cart price crashes the plan screen.** `src/lib/grocery-state.ts` `cartItems` accepts any optional price, while `src/app/list.tsx` calls `item.price.toFixed(2)` for every defined price. A restored/streamed cart with `{name: 'Milk', quantity: 1, price: '3.50'}` or `price: null` survives normalization and throws during rendering. Expected: invalid external values cannot crash rendering. Fix the state boundary, retaining valid cart entries and intended public types.
2. **High confidence, medium impact: edits made during save are discarded.** `src/app/saved-list.tsx` title/add fields and `src/app/saved-recipe.tsx` fields/ingredient/step controls remain editable while their form submission awaits HTTP. Success resets the form (and title/recipe navigates away), erasing any text entered after the submitted snapshot. Expected: pending saves cannot silently accept edits they will discard. Freeze the submitted editor controls until completion; preserve failed drafts for retry.

3. **High confidence, medium impact: chat resets lose or repeat drafts.** `ChatComposer` uses `reset()` after sending, restoring the route-provided initial prompt rather than clearing it. When a run later fails, unconditional reset overwrites a new draft typed during streaming. Explicitly clear the submitted text; restore failed input only when no newer draft exists (the separate Retry action retains failed input).

The pending-save finding also applies to shared-list create/add and household create/join forms, which reset after success. Apply the same pending input freeze there.

## Rejected hypotheses and limits

- Household key collisions across accounts: user identity is present in all grocery keys. No demonstrated cross-account read leak.
- Repeated keyboard/button submission: existing `createSingleSubmit` acquires a lock before asynchronous validation; preserve its regressions.
- Automatic duplicate writes on failed requests: mutation retry is disabled. Ambiguous server commit/network failure still requires server idempotency; no new client retry policy is invented.
- Callback double nonce consumption: existing callback deliberately polls rather than consuming the owner’s nonce.
- Chat cancellation overwriting a new conversation: transitions await old operations and detached sessions avoid snapshot restoration; existing controller tests cover these paths.
- No claim is made that fixtures prove live Clerk/Kroger behavior, backend tenant enforcement, or production checkout. Native layout/keyboard/back/accessibility checks will be CI evidence, not local emulator runs.

## Regression and framework plan

Published npm metadata verified `e2e@0.23.0` (tester-army/e2e), Node `^22.22.3 || >=24.8.0`; current upstream quickstart, mobile, CI and GitHub Actions docs read. Use deterministic `@e2e-dev/mobile` actions/assertions, no agent/model calls or credentials. Native CI will build an isolated fixture app that renders actual production editors with controlled auth/HTTP boundaries. It must demonstrate save failure, draft retention, retry and persisted results, rather than a body-visible smoke check. Preserve existing tests and exports. Add a CI pre-fix reproduction gate for new unit regressions, with explicit expected failures on baseline code.

## Evidence and outcome

PR: [#49](https://github.com/aranlucas/grocery-agent-mobile/pull/49). Independent review and implementation are complete. No local tests/builds run.

Independent review (same-provider child, static only) confirmed all three defect classes and rejected additional speculative findings. Implementation review found and resolved the mobile fixture import typing issue; requested baseline proof for pending-save behavior and item reopening assertions have been added. No remaining concrete production-code objection was reported. Editor controls preserve submitted values because the shared native adapter uses `editable=false` rather than RHF payload omission.

Pinned integration: `e2e@0.23.0`, `@e2e-dev/mobile@0.12.6` (compatible peer range >=0.22.1 <1), agent-device transitively pinned by the engine. These libraries were chosen as the user-requested supported native runner; Node 24.22.1 satisfies its runtime. Installed skill/setup/writing/running guides were also read. Production configuration remains separate from the CI-only fixture package `dev.agents.grocery.e2e`. The fixture preserves actual `useHouseholdApi`/`openapi-fetch`, RHF controls and TanStack mutation/invalidation behavior. No new custom command scripts were needed: declarative Metro/Expo config, native Gradle and existing Vitest cover the workflow.

CI includes exact unit negative controls (seven expected failures, two passes on baseline), sequential native baseline/fixed builds, and report uploads. Native baseline must fail specifically at `toBeDisabled`; arbitrary setup failures do not count as successful reproduction. The native journey currently covers dark mode, accessible locators, keyboard text entry, pending edit protection, failed-save retention, retry, navigation and reopening persisted state. Wide/reduced-motion behavior and live Clerk/Kroger remain limitations unless further CI evidence is added.

Follow-up: all Vitest test files and their shared adapter now use TypeScript; discovery, CI negative-control paths and contributor instructions have been updated. Explicit test fixture types preserve the assertions under strict checking. `@types/react-test-renderer` supplies the maintained renderer declarations rather than a custom ambient shim. The baseline regression job passed on `bb77bb7` ([CI run](https://github.com/aranlucas/grocery-agent-mobile/actions/runs/42299224626)); this establishes expected pre-fix failures, not full-suite or native success.

At head `bfa2995`, [full CI](https://github.com/aranlucas/grocery-agent-mobile/actions/runs/42300030510) passed lint, formatting, strict typechecking, unit tests, Expo dependency checks and Android/iOS exports. [Reliability CI](https://github.com/aranlucas/grocery-agent-mobile/actions/runs/42300030480) verified the seven expected unit baseline failures, the native baseline failure at `expect.toBeDisabled`, and the complete fixed native journey passing. Final log inspection found that upload-artifact excludes hidden directories by default; explicitly include the controlled `.e2e` directory and fail if evidence is missing. Validation of this artifact fix is pending.
