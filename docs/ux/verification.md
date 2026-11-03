# Native UI review

For UI changes, record the platform/device, app revision, configuration, journeys,
and observed failures in the pull request. Check keyboard avoidance, Android Back,
accessibility labels and screen-reader traversal, dark mode, reduced motion,
large text, and narrow/wide layouts. Static checks and JavaScript exports do not
establish native or live-service behavior.

## Isolated review

`pnpm review:ui` copies the app screens into a temporary workspace with local
service/authentication fixtures and starts Metro on port 8082. Open that Metro
URL in a development client. The printed workspace is separate from the production
app; simulated auth and mutations cannot establish backend authorization or
persistence.

Through the agent runtime evaluator, call
`globalThis.__groceryReview.scenario('content')`. Other scenarios are `empty`,
`loading`, `error`, `connected`, `chat-error`, and `signed-out`.
`globalThis.__groceryReview.failNext()` rejects the next local service request.
Simulated auth codes accept `123456`; other codes produce an invalid-code state.
Stop the review Metro process when done.

## Live validation and historical evidence

Repeat affected journeys with a development account and gateway when persistence,
authentication, streaming, sharing, or commerce is involved. Distinguish seeded
records from records created through the UI, and report incomplete operations.
A connected badge alone does not prove cart access or a successful cart write.

The [fixture gallery](index.html) and [development-account gallery](live.html)
preserve September 2026 Android captures and failures. They are historical
observations, not certification of the current dependency versions. The live rerun
encountered provider-schema and streaming/cancellation failures; generated-plan
completion and cart writes were not established. Broader authorization/concurrency,
Google SSO, screen-reader traversal, and physical-device performance also need
independent coverage.

Android predictive Back is disabled in [app.json](../../app.json) because the
reviewed native stack bypassed JavaScript dirty-edit handlers. Re-enabling it
requires a rebuilt native client and a dirty-edit Back test; an OTA-only check
cannot verify that configuration change.
