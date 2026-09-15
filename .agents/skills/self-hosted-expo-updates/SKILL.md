---
name: self-hosted-expo-updates
description: "Publish and test Expo OTA updates through a server you control using the open Expo Updates protocol. Use expo-updates, expo export, runtime-version safety, code signing, custom manifests, and rollback testing without a hosted update service."
license: MIT
---

# Self-hosted Expo Updates

`expo-updates` is an open client library that talks to any server implementing the Expo Updates protocol. A custom server is responsible for publishing manifests, serving assets, enforcing runtime compatibility, authenticating publishers, and retaining rollback artifacts.

## Before enabling updates

1. Confirm that `expo-updates` is installed and that the app has a release build path.
2. Set an explicit `updates.url` and `runtimeVersion` in app config. Changing native code or SDK versions requires a new runtime and a new native build.
3. Decide whether update signing is required; for production, generate and protect a signing key and embed only the public certificate in the app.
4. Choose a server implementation. Expo maintains a [custom server and client example](https://github.com/expo/custom-expo-updates-server); it is a protocol demonstration, not a guaranteed production backend. Review and harden any server before using it for real users.

## Publish an update

- Run the project checks and export platform bundles with `npx expo export --platform android` and/or `npx expo export --platform ios`.
- Keep the generated manifest, assets, app config, runtime version, and signing metadata together as one immutable release artifact.
- Upload the artifact to the custom server through an authenticated script or CI job. Never put the private signing key in the app or repository.
- Test the update against a release build with the same runtime version, then test an incompatible runtime and a rollback directive.

## Server requirements

The server must implement the Expo Updates protocol for the requested platform and runtime version, return the correct manifest and assets, support cache headers, and handle code-signature validation when enabled. Add authentication, atomic publication, retention, rollback, audit logs, and health checks before production use.

Do not publish an OTA update that depends on a native module or config change absent from the installed binary. Use a new native release for those changes.

## Local test loop

Use a local server and an emulator/device on the same network. Force-close and reopen a release build, inspect the manifest and asset requests, then verify that the update applies only after the documented restart behavior. Preserve the embedded bundle as a safe rollback target.

## References

- Expo Updates API: https://docs.expo.dev/versions/latest/sdk/updates/
- Expo Updates protocol: https://docs.expo.dev/technical-specs/expo-updates-1/
- Custom server example: https://github.com/expo/custom-expo-updates-server
- Client development notes: https://github.com/expo/expo/blob/main/packages/expo-updates/DEVELOPMENT.md
