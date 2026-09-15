---
name: open-source-observability
description: "Instrument Expo and React Native apps for performance, errors, and custom events with open protocols and locally controlled backends. Use OpenTelemetry, an existing Sentry SDK, OTLP collectors, JSON logs, and Prometheus/Grafana-style tooling instead of a hosted app-metrics service."
license: MIT
---

# Open-source observability

Start with the instrumentation already in the project. This repository already has `@sentry/react-native`; extend its existing setup before adding another SDK. Use OpenTelemetry when the project needs vendor-neutral traces or metrics, and send telemetry to a collector or backend the project controls.

## Instrument the app

- Record a stable app version, native build number, platform, runtime version, and update identifier when available.
- Mark meaningful lifecycle points such as app start, first usable screen, route transitions, network requests, and grocery-agent operations.
- Capture handled errors with a redacted error code and operation context. Never include tokens, grocery purchase credentials, or personal data in event attributes.
- Keep startup instrumentation lazy enough that it does not delay rendering the first screen.
- Gate verbose development logging behind a development flag and sample high-volume events in production.

## Backend choices

- OTLP Collector: receive HTTP or gRPC telemetry, apply filtering/redaction, and fan out to a selected backend.
- Prometheus/Grafana: metrics and dashboards for aggregate counters, durations, and error rates.
- Jaeger or another OpenTelemetry-compatible trace store: distributed traces when the backend has trace context.
- Sentry-compatible error tracking: use the existing SDK for crash and exception context; verify its DSN and retention policy before shipping.
- JSONL or SQLite: a simple local artifact for deterministic tests and offline analysis.

OpenTelemetry JavaScript packages can work in React Native but are not explicitly supported for every React Native runtime. Prove the chosen package versions on both platforms before making them a hard dependency; the official React Native example documents this limitation.

## Validate

1. Run the app in development and confirm the instrumentation does not throw or block navigation.
2. Trigger one representative handled error and one performance event with a local collector or test sink.
3. Verify that release, platform, route, and update dimensions are present and secrets are absent.
4. Test offline behavior and bounded retry/backoff so telemetry cannot affect grocery actions.

Do not promise historical adoption, crash-rate, or rollout dashboards unless the app is already sending the required events to a backend. Measurements cannot be reconstructed from a bundle alone.

## References

- OpenTelemetry React Native example: https://opentelemetry.io/docs/demo/services/react-native-app/
- OpenTelemetry specification: https://opentelemetry.io/docs/specs/otel/
- Sentry React Native SDK: https://docs.sentry.io/platforms/react-native/
- OTLP: https://opentelemetry.io/docs/specs/otlp/
