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
  platform, arm64 executable, absent provisioning/signature, and embedded JS.
- The app uses Expo 57.0.26 / RN 0.86.3, beyond the documentation's Expo 55 example.
  The pilot pins Node 24.18.1 and pnpm 12.8.1; local compatibility must be proven
  by a real native build and launch, not inferred from the EAS-compatible parser.

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
The pilot keeps only its CNG → Pods → unsigned `xcodebuild` → tar path and the
`eas-build.yml` filename/dispatch contract. Actions are pinned, checkout does not
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

The resulting app is intentionally limited to the existing **Setup needed**
configuration guard. Native launch, rendering, disclosure accessibility, deep
link handling into that guard, light/dark appearance, and reduced motion can be
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
requires an already authorized token able to dispatch/read Actions on this repo;
do not create PATs, OAuth grants, signing assets, or persistent auth. If existing
access fails, stop that step and request only the smallest repository-specific
permission. Merging, production builds, signing, submissions, and paid services
require separate approval.

## Verification result

To be filled with the actual local build, launch, artifact, and CI outcome before
the draft PR is handed back.
