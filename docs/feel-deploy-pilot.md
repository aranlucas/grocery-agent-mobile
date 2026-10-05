# React Native Feel Deploy simulator pilot

This is a separate, unsigned iOS Simulator experiment alongside EAS. It does not
replace any existing EAS profile, release workflow, production app identity, or
remote version policy. It has no submission, device signing, Android build,
install service, or credential setup path.

## Assessment (5 October 2026)

- [Landing page](https://reactnativefeel.com/deploy): builds run in the repository's
  GitHub Actions, using standard macOS/Linux runners. This repository is public;
  this pilot fixes the runner to standard `macos-26`, with no larger paid runner.
- [Differences from EAS](https://react-native-deploy.pages.dev/deploy/docs/guide/differences):
  no remote version server, no applied `autoIncrement`, no EAS environment fetch,
  and no local build command. Production remains on EAS with
  `cli.appVersionSource: remote` and `production.autoIncrement: true`.
- **Observed package behavior:** `rnd config` in 0.3.0 accepts this repository's
  remote version setting. Its build handler does not use a version server;
  `build:version:set` refuses. Parsing remote settings is not support for remote
  versioning. Do not use this pilot to build a production profile.
- The CLI reads metadata from `app.json`, without evaluating `app.config.js`.
  Dynamic config runs during prebuild. The resulting app is checked for the pilot
  identity (`dev.agents.grocery.feelpilot`), local build number `1`, simulator
  platform, arm64 executable, absent device provisioning/root resource signature,
  and embedded JS. Automatic ad hoc simulator/linker signatures require no
  developer identity and can remain in the app and dependency frameworks.
- The app uses Expo 57.0.26 / RN 0.86.3, beyond the documentation's Expo 55 example.
  The pilot pins Node 24.18.1 and pnpm 12.8.1; local compatibility must be proven
  by a real native build and launch, not inferred from the EAS-compatible parser.
- This Mac uses Xcode 27. GitHub's current
  [macos-26 image documentation](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-Readme.md)
  lists Xcode 26.6 as default. Local build proof does not establish compatibility
  with the hosted runner toolchain; that remains a separate CI result.

## Package and workflow review

The exact npm package is `@react-native-feel/deploy@0.3.0`. The published tarball
contains a bundled CLI, a workflow template, README, and package metadata; there
are no install/postinstall hooks. It was downloaded and inspected before
execution, installed only in a temporary directory with `--ignore-scripts`, and
its SHA-512 was verified against npm metadata:

```text
BKb5rzPVnUEO7wPxoL6oT3COW7wku0m8YbXrRYLVGd/obSyCBo4hk0dbSsNh9NwTCptNC87dwIFBZoj4fIe9bw==
```

The linked source repository, `https://github.com/bidah/react-native-deploy`,
returned HTTP 404. The advertised differential/contract tests are absent from the
published package and could not be independently reviewed or run. This limits
confidence in the compatibility claims.

The stock template SHA-256 is
`69bf6bc354a50fc9a068cd1089bad7554761b5c7baae41c37c6f9ee9b436b07d`.
It includes signing, App Store Connect, Android, and install-service steps,
prints the input plan (including environment), and installs unpinned pnpm.
The pilot implements a custom CNG → Pods → unsigned `xcodebuild` → tar wrapper
and keeps the `eas-build.yml` filename/dispatch contract. This is a simulator-only
adaptation of the template, not an end-to-end Deploy build test. Actions are
pinned, checkout does not
persist credentials, and permission is `contents: read`. Input is validated as
data; it never becomes shell code, environment, checkout ref, or runner choice.
No repository secret is referenced. Existing CI checks remain required.

## Environment and runtime boundary

`feel-simulator` does not inherit an EAS production/development environment.
`GROCERY_FEEL_SIMULATOR=1` enables a separate iOS identity and explicitly clears
Clerk configuration while using `example.invalid` backend/marketing endpoints.
The native build uses an allowlist of host toolchain variables, ignores dotenv,
clears the runtime Sentry DSN, disables Sentry uploads and Expo/Deploy telemetry,
and never passes GitHub/signing/backend credentials to native commands.
This filters inherited environment variables; it is not a filesystem or network
sandbox. Native tools retain normal `HOME`, filesystem access, and network access.
Sentry's debug-symbol phase resolves its CLI before honoring the upload-disable
flag, which fails with this pnpm layout. The pilot additionally sets its supported
`SENTRY_CLI_EXECUTABLE` override to `/usr/bin/false`: the disabled phase skips
uploads without CLI resolution, and any accidental uploader invocation fails
locally. The actual installed Sentry 7.11.0 scripts were checked in isolation:
the disabled debug-symbol phase exits zero, the required JavaScript bundle still
executes, and a bundle failure propagates its nonzero exit. No
`SENTRY_ALLOW_FAILURE`, plugin removal, or phase removal is used. Production's
Sentry plugin and configuration remain intact; pilot runtime reporting is disabled.

The resulting app is intentionally limited to the existing **Setup needed**
configuration guard. Native launch, rendering, disclosure accessibility, deep
link handling into that guard, light/dark appearance, and larger text can be
checked without accounts. Sign-in, chat, grocery lists, household sharing,
Kroger connection/cart actions, and authenticated API calls cannot be verified
with this artifact. No private account interactions should be attempted.

## Local reproduction

Use Node 24 and pnpm 12.8.1 on a Mac with full Xcode and CocoaPods. First inspect
the pinned npm tarball, verify the SHA-512 above, and install it with lifecycle
scripts disabled into a temporary directory. Do not run `rnd login` or configure
tokens; local profile resolution needs no authentication.

```sh
pnpm install --frozen-lockfile
mkdir -p dist/feel-pilot
DO_NOT_TRACK=1 RND_TELEMETRY_DISABLED=1 node /path/to/temporary/deploy/dist/bin/rnd.js \
  config --platform ios --profile feel-simulator --json > dist/feel-pilot/resolved-profile.json
node scripts/feel-simulator.mjs check
pnpm validate
pnpm build:feel:simulator:ios
```

Deploy itself refuses `build --local`; the checked-in local build script exercises
the reviewed simulator steps. It creates an embedded Release bundle (no Metro
needed), verifies it, and writes
`dist/feel-pilot/GroceryAgentFeelPilot-simulator.tar.gz` plus local metadata.
Install the extracted `.app` with `xcrun simctl install <UDID> <app>` and launch
`dev.agents.grocery.feelpilot`. Use a clean simulator; do not erase another task's
device. Record the OS/device, screenshot, visible UI, and crash evidence.

## CI and approval boundary

The workflow runs only for this same-repository pilot PR or an explicit dispatch
on `pilot/feel-deploy-ios-simulator`. PR triggering makes it testable before a
dispatch-only workflow is registered on the default branch. A native artifact is
uploaded as `application-archive` for seven days after verification. Public
artifacts contain no account data or service settings. Do not upload DerivedData,
app data, dotenv, auth files, or credential stores.

GitHub's [runner-assignment incident](https://www.githubstatus.com/incidents/3q1yb5m7ltvb)
was still investigating during preparation; queued CI is not a passing check.
No runner/permission changes are justified by that incident. A direct `rnd build`
requires an already authorized token able to dispatch/read Actions on this repo.
No appropriate ephemeral Actions-write credential was available, so that step is
blocked. The Mac's broad GitHub CLI credential was not passed to third-party
Deploy code. Do not create PATs, OAuth grants, signing assets, or persistent auth,
or expand workflow/token permissions. Merging, production builds, signing,
submissions, and paid services require separate approval.

## Verification result

The local native build completed successfully on 5 October 2026 with Xcode 27.0
(27A266a), Node 24.18.1, and pnpm 12.8.1. It built Expo 57.0.26 / RN 0.86.3 without
changing dependencies. The verified archive contains version `1.0.4`, local build
`1`, bundle ID `dev.agents.grocery.feelpilot`, arm64 and x86_64 simulator code,
and an embedded Release JavaScript bundle. `CODE_SIGNING_ALLOWED=NO` was used;
there is no provisioning profile or developer signing team. Ad hoc signatures
from the linker and dependency frameworks remain.

```text
Archive: dist/feel-pilot/GroceryAgentFeelPilot-simulator.tar.gz
Size: 46,280,113 bytes
SHA-256: a311d4944d570e9fc128b2cd260f10c62b33b0cf8a9cdeae7a4c6622fe6b2afd
```

The extracted archive, rather than an intermediate build directory, was installed
on a dedicated clean iPhone 17 simulator:

- **iOS 26.5 (23F77), portrait:** actual launch and embedded JavaScript rendering
  passed. The existing configuration guard displayed **Setup needed**, and its
  **Technical details** disclosure showed **Clerk sign-in is not configured for
  this build**. The isolated `grocery-agent-feel-pilot://chat` URL returned to the
  guard after accepting the OS's Open prompt. Light/dark appearance and Dynamic
  Type `large` / `accessibility-large` were visually checked. The process remained
  alive for more than four minutes; no fatal JavaScript error or native crash was
  observed during these checks. Logs included background-mode and simulator
  accessibility duplicate-class warnings.
- **iOS 27.0 (24A434): launch failed.** A repeat launch returned to the home screen
  before JavaScript. The crash report records `EXC_BREAKPOINT` / `SIGTRAP` with
  faulting UIKit frame
  `___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke`.
  This lifecycle compatibility issue is unresolved; no production lifecycle
  change or workaround was introduced.
- Reduced-motion state was not independently verified; reduced-motion behavior,
  keyboard interaction, wide layouts, Android Back, and private account flows
  were not tested. These screenshots demonstrate only the configuration guard.

[Light appearance and disclosure](images/feel-pilot/ios-26-5-light.jpg) ·
[Dark appearance with larger text](images/feel-pilot/ios-26-5-dark-larger-text.jpg)

Local checks passed: `pnpm validate` (lint, formatting, typecheck, 39 tests), online
`expo install --check`, `pnpm build` (Android/iOS JavaScript exports), and
actionlint 1.7.12. The pinned Deploy resolver agreed with `@expo/eas-json` 24.5.0
for the pilot profile. An offline, fetch-stubbed invocation of the actual
`rnd build` handler generated a plan accepted by the guards; it used a placeholder
token and made no GitHub requests. This tests the wire format only.

The [initial hosted pilot run](https://github.com/aranlucas/grocery-agent-mobile/actions/runs/37368698928)
at `69ecfc7` passed installation, Deploy profile resolution, and app validation,
then failed native build at Sentry's `@sentry/cli/package.json` lookup. The
pilot-only override fixes that failure locally. A finished hosted build of the
updated commit is still required; follow the draft PR's checks for its result.
Existing CI/CodeQL checks were not weakened or bypassed.

**Product integration remains blocked:** no genuine authenticated `rnd build`
dispatch, CLI status/artifact lifecycle, or downloaded hosted-artifact launch was
completed. The custom workflow and local wrapper do not establish those product
behaviors. The smallest next decision is whether to provide an already authorized,
repository-scoped Actions-write/read ephemeral credential for a one-time Deploy
dispatch, or leave this draft at audited configuration and local build proof.
The current workflow job's read-only token must not be expanded for that purpose.
