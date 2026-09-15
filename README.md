# Grocery mobile

Standalone Expo client for grocery planning. It includes authenticated grocery-agent chat, Kroger connection flows, product results, active and saved lists, saved recipes, household sharing, chat history, account settings, and report/support links.

## Development

```bash
pnpm install
pnpm start
pnpm android
pnpm ios
pnpm web
```

Validate the app with:

```bash
pnpm check && pnpm test
```

Copy `.env.example` to `.env.local` and configure the Clerk publishable key, CopilotKit runtime, Sentry DSN, and public grocery marketing URL. Native builds use the Expo configuration in `app.json` and `eas.json`; Expo Go does not provide the complete native-client experience.

`src/lib/grocery-gateway.d.ts` is a checked-in generated client type. Its canonical OpenAPI source remains in the upstream `agents` repository, so this standalone client intentionally does not carry a broken local `api:check` path.
