# Repository untangling decision log

## Scope and baseline

Exact skill read before work: https://github.com/caldoai/skills/blob/main/skills/untangle-codebase/SKILL.md (raw main fetched 2026-11-05). Both optional additions selected: remove restating comments; review tests last. Work stays in this isolated worktree. Initial git status was clean. No dependency upgrades or deployments. User subsequently authorized commit, push, PR creation, and merge after checks/review requirements pass.

Inventory covered all source routes, hooks, domain utilities/contracts, platform UI adapters, scripts, test suites, root configuration, CI and documentation references. Independent agents inventoried domain and platform boundaries before edits. Approximately 9,400 lines in domain/routes/scripts/tests, plus UI primitives and generated gateway types.

Baseline: `pnpm test`: 8 files, 44 tests passed. Typecheck/lint baseline commands started separately; results recorded below when available. Tool-host timeouts are infrastructure failures, separate from code failures.

## Design before implementation

- Own collection contracts in the pure collection module.
  - Hidden/needless links: `lib/collection.ts` imports filter types from a rendered toolbar and saved-resource shape from a React hook. Toolbar, loaders and screens should depend on the collection contract.
- Own list edits and their cache dependencies in one domain mutation definition using TanStack Query mutation options.
  - Hidden links: saved-list and shared-list duplicate add/toggle/delete dispatch and paired detail/collection invalidation. Screens currently must know which queries every edit affects.
  - Keep title-form reset/navigation, new-list selection, input resets, and per-screen mutation state local. One saved-list mutation continues to serialize title and item edits.
  - Normalize absent household IDs in list query keys, as already done for recipes: personal loaders use null while detail records supply undefined/null. Equivalent API scopes must share a cache entry.
- Define the grocery agent identity once in the domain contract.
  - Hidden link: provider and controller/subscriptions repeat the same agent ID.
  - Retain operation cancellation, snapshot rollback, and SDK-error scoping: these protect tested async races. Do not replace them with an unproven generic state machine.
- Remove source-owned surplus.
  - `list.tsx` default screen only wraps GroceryListContent with no boundary or behavior.
  - PromptInputToolbar/Spacer/Button have no consumers; remove them, keeping used input/send primitives.
  - FormField only forwards Controller props; expose the library component directly under the existing name.
- Anchor Android release commands to this app repository.
  - Hidden link: android-release.mjs assumes the app is nested two folders below the Git root. This standalone worktree contradicts that assumption. Use the app directory for Git/gh operations; do not run publish.
- Remove implementation-restating comments; retain explanations of external SDK constraints and platform limitations.
- Review tests after implementation. Retain behavior/race/format/security regressions. Replace/remove only demonstrably incidental assertions; no quota for deletions.

## Required special cases retained

- Clerk accepts two Kroger provider IDs, a one-time nonce owner, and bounded callback polling for eventual external-account propagation. No local redesign removes that external timing requirement.
- Copilot emitted-error observation, thread scoping, stop/disposal guards and snapshot rollback protect cancellation and failures after an SDK promise resolves.
- Stream normalization tolerates malformed/partial external messages and recipe drafts; image URLs remain constrained to Kroger.
- Offline/paused query states differ from empty results; cached content survives refresh failures.
- Android native input/accessibility fallbacks and platform file dispatch reflect Expo UI limitations. Native headers, semantic Uniwind styling, reduced motion, scroll/keyboard behavior remain intact.
- RHF duplicate-submit gating and compiler directive protect same-render keyboard/button submissions and form-state proxy updates.

## Validation and review outcomes

Implementation complete; repeat independent reviews and validation recorded below. Native validation depends on available device hosts; report limitations explicitly.

## Resume findings

- Baseline typecheck passed. First refactor check exposed mutation option inference/callback errors, recorded as introduced failures and corrected before rechecking.
- Device service: no Android SDK installed; iOS requires macOS/Xcode. Native keyboard/back/accessibility/theme/layout matrix cannot be exercised on this host.
- Removed brittle manifest/lockfile assertions from Router decoding regression; retained Unicode, repeated keys, encoding round-trip, and malformed-escape behavior. Existing navigation tests remain: replacing their harness is optional test infrastructure work, not needed by these untouched navigation semantics.
- Conversation snapshot extraction deferred after inspection: send rollback intentionally preserves current thread while open rollback restores it, and disposal semantics differ; tested explicit branches are clearer than a parameterized shared helper.

## Validation after server restart

- Confirmed surviving edits rather than replaying cancelled mutations.
- `pnpm test`: 9 files, 49 tests passed. Added real TanStack Query cache/mutation regression coverage for title/add/toggle/delete payloads, related-cache invalidation, unrelated-cache isolation and failed-edit preservation.
- Independent domain reviewer found no concrete behavior regression in collection ownership, personal scope normalization or migrated list mutation callers; requested the behavioral tests above, now passing.
- Sequential typecheck restarted after confirming the earlier handle was cancelled; lint, formatting and final review remain pending before commit/PR.

- Latest `expo-agent-cli typecheck`: passed, no type errors (657824ms under constrained host load).
- UI review fixture no longer creates a dangling monorepo packages symlink. Removed the now-singleton symlink loop. No source styling or native header changes.

- Final independent review found one unused item-status string/guard in shared-list busy state; removed it, retaining only consumed create/add statuses. Reviewer found no further worthwhile structural or regression issues across full diff and new tests.

## CI-only continuation

Latest user instruction supersedes local validation: no more local tests, benchmarks, browser tests or test builds. Process inspection found no remaining thread-owned validation process. Historical test/typecheck outcomes above predate this restriction and are not claims about the final formatted commit. Final behavioral validation will come from PR CI, which already runs `pnpm test`, lint/format, typecheck, Expo dependency validation and Android/iOS export checks. Vercel deployment checks alone are non-blocking; every other required gate and review requirement remains required. Formatting of changed files and `git diff --check` passed before commit.
