# React Native Feel Deploy simulator pilot

This experiment builds an unsigned, embedded-Release iOS Simulator app with a
separate identity. It does not replace EAS production releases. Production uses
remote versioning and automatic version increments; this pilot fixes its local
build number and must not be used for production profiles.

## Boundaries and rationale

- [eas.json](../eas.json) defines the isolated `feel-simulator` profile.
  [app.config.js](../app.config.js) assigns `dev.agents.grocery.feelpilot`, clears
  Clerk configuration, and selects `example.invalid` service endpoints. The app
  intentionally stops at **Setup needed**; it cannot verify authenticated flows.
- [scripts/feel-simulator.mjs](../scripts/feel-simulator.mjs) validates the resolved
  profile and dispatch plan as data. Input never selects shell code, environment,
  checkout ref, or runner. Native subprocesses receive an allowlist of toolchain
  variables, with dotenv, runtime Sentry, uploads, and telemetry disabled. This is
  environment filtering, not a filesystem or network sandbox.
- `SENTRY_CLI_EXECUTABLE=/usr/bin/false` avoids Sentry CLI resolution in the
  disabled upload phase and fails locally if an uploader is accidentally invoked.
  Keep the JavaScript bundle phase and propagate build failures.
- The wrapper checks the simulator identity, scene manifest, local build number,
  arm64 code, embedded JavaScript, and absence of device provisioning/root
  resource signatures. Automatic ad hoc linker/framework signatures can remain.
- The [workflow](../.github/workflows/eas-build.yml) adapts
  `@react-native-feel/deploy@0.3.0`'s simulator template; its attribution and
  template hash remain in the workflow. It verifies the npm tarball's SHA-512,
  installs it temporarily with lifecycle scripts disabled, and uses only its
  profile resolver. The custom wrapper builds the artifact. This does not prove
  the authenticated `rnd build` dispatch/status/download lifecycle.

## Reproduction contract

Use Node 24, full Xcode, and CocoaPods. The pilot's resolver/toolchain pins are in
`eas.json`; they differ from the app's current package-manager pin. Follow the
workflow's integrity-checked resolver step to produce
`dist/feel-pilot/resolved-profile.json` before running:

```sh
node scripts/feel-simulator.mjs check
pnpm build:feel:simulator:ios
```

The build generates native files, installs Pods, runs unsigned `xcodebuild`, and
writes `dist/feel-pilot/GroceryAgentFeelPilot-simulator.tar.gz` plus artifact
metadata. It requires no service login or signing identity. Do not substitute a
production profile or pass backend, signing, or GitHub credentials to native tools.

## Hosted execution and evidence limits

The workflow accepts only the `pilot/feel-deploy-ios-simulator` branch and the
standard `macos-26` runner, with read-only repository permissions. A normal feature
branch does not exercise that native job. Keep artifacts limited to the verified
archive and build diagnostics; exclude app data, dotenv, auth files, credential
stores, and DerivedData. The archive retention is seven days.

The [October 2026 screenshots](images/feel-pilot/ios-27-light.jpg) preserve a local
configuration-guard launch; [dark/larger-text](images/feel-pilot/ios-26-5-dark-larger-text.jpg)
and [live text-size clipping](images/feel-pilot/ios-26-5-live-text-change.jpg) captures
show the tested surface and a limitation. The [light capture](images/feel-pilot/ios-26-5-light.jpg)
provides the comparison. Those captures predate the current SDK and do not establish
current hosted-runner compatibility, authenticated app behavior, or the full Deploy
lifecycle. Revalidate those claims separately before expanding the pilot.
