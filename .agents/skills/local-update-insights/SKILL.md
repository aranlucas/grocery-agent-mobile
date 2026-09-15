---
name: local-update-insights
description: "Inspect and measure self-hosted Expo update artifacts and rollout telemetry locally. Use for manifest/runtime checks, bundle-size reports, release comparisons, Sentry or OpenTelemetry event analysis, and rollback readiness."
license: MIT
---

# Local update insights

There is no universal client-side source for historical install counts or adoption. Build those measurements into the app and backend explicitly; do not infer them from `expo export` metadata.

## Static artifact checks

For every exported update, record:

- platform and architecture;
- app version, native build number, and runtime version;
- update identifier, creation time, branch/channel label, and commit SHA;
- JavaScript bundle and asset sizes;
- code-signing status and the set of referenced assets.

Use `metadata.json`, the manifest, `jq`, Node.js, or a small checked-in script to compare releases. Fail a release when a native dependency is used with an incompatible runtime or an expected asset is missing.

## Runtime telemetry

Emit redacted events through the project’s observability stack for:

- update check started, available, downloaded, applied, rejected, or rolled back;
- launch success/failure and the currently running update ID;
- app version, build number, runtime version, platform, and release label;
- bundle load duration and errors.

Prefer the existing Sentry integration for errors and OpenTelemetry/OTLP for vendor-neutral metrics. Store raw development events as JSONL or SQLite when a local, deterministic report is enough.

## Rollout report

When asked whether an update is healthy, define the population and time window first. Report counts and rates with denominators, separate embedded/native launches from OTA launches, and identify the runtime/platform dimensions. Treat missing telemetry as unknown, not zero.

Keep personal data and authentication material out of update dimensions. Retain the exact artifact and manifest needed to reproduce or roll back a report.

## References

- Expo Updates: https://docs.expo.dev/versions/latest/sdk/updates/
- Expo Updates protocol: https://docs.expo.dev/technical-specs/expo-updates-1/
- OpenTelemetry: https://opentelemetry.io/docs/specs/otel/
- Sentry React Native: https://docs.sentry.io/platforms/react-native/
