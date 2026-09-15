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

## Android releases

The **Release Android APK** workflow in `.github/workflows/release-android.yml` runs only when manually dispatched through **Actions → Release Android APK → Run workflow** or the GitHub CLI. Select the branch to build (or pass a branch/tag with `gh workflow run --ref`) and optionally mark the release as a prerelease. Pushes to `main` and pull requests run the separate check/test CI workflow; they do not build or publish APKs.

The release workflow checks and tests the selected commit, builds a signed APK on the GitHub runner using the existing EAS `production-apk` profile, and publishes these assets in the repository's **Releases** tab:

- `grocery-agent-<version>.apk`
- `grocery-agent-<version>.apk.sha256`

The version comes from `app.json` and must match `package.json`. The tag is `grocery-v<version>` and points to the selected commit. Bump both versions before another release; existing tags and releases are never overwritten. EAS continues to manage and increment the Android version code through `eas.json`.

### One-time configuration

In **Settings → Secrets and variables → Actions**, configure:

| Type                | Name                                 | Value                                                                                                                     |
| ------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Secret              | `EXPO_TOKEN`                         | Expo access token with access to the existing `@aranlucas/grocery-agent` EAS project and its Android signing credentials. |
| Variable            | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`  | Production Clerk publishable key beginning with `pk_live_`.                                                               |
| Variable            | `EXPO_PUBLIC_COPILOTKIT_RUNTIME_URL` | Production gateway URL, currently `https://agents-gateway.up.railway.app`.                                                |
| Variable            | `EXPO_PUBLIC_GROCERY_MARKETING_URL`  | Production marketing URL, currently `https://agents-lucas.vercel.app/grocery`.                                            |
| Variable (optional) | `EXPO_PUBLIC_SENTRY_DSN`             | Public Sentry DSN for runtime error reporting.                                                                            |

The EAS project must already have Android signing credentials configured for `production-apk`; non-interactive builds cannot create missing credentials. Reuse the app's existing keystore so installed copies can be updated. Keep any matching public values in EAS's `production` environment consistent with these GitHub variables. EAS variables with Secret visibility are unavailable to local builds. See [Expo's local-build requirements](https://docs.expo.dev/build-reference/local-builds/) and [non-interactive build setup](https://docs.expo.dev/build/building-on-ci/).

GitHub provides the release token automatically through `github.token` with `contents: write`; no GitHub personal access token is needed. Sentry source-map auto-upload is disabled for this workflow. The workflow creates a draft while uploading and publishes it only after both assets succeed. If publishing fails after draft creation, inspect that draft in **Releases** and either finish publishing it or remove the failed draft (and its tag, if created) before retrying the same version.

## Native architecture review

See [the review of Ferran's React Native post and replies](docs/native-platform-review.md) for the app's current matches, gaps, and suggested priorities.

See [the Expo UI migration notes](docs/expo-ui-migration.md) for native controls, form adapters, popup behavior, and verification. The versioned Expo UI Android accessibility and keyboard patch requires the `expo-ui` module to build from source, as configured in `package.json`; rebuild the native app after changing this patch.
