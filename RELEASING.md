# Android APK releases

The **Release Android APK** [workflow](.github/workflows/release-android.yml) runs only when manually dispatched through **Actions → Release Android APK → Run workflow** or the GitHub CLI. Select the branch to build (or pass a branch/tag with `gh workflow run --ref`) and optionally mark the release as a prerelease. Pushes to `main` and pull requests run the separate validation and export CI workflow; they do not build or publish APKs.

The release workflow validates the selected commit, builds a signed APK on the GitHub runner using the existing EAS `production-apk` profile, and publishes these assets in the repository's **Releases** tab:

- `grocery-agent-<version>.apk`
- `grocery-agent-<version>.apk.sha256`

The version comes from `app.json` and must match `package.json`. The tag is `grocery-v<version>` and points to the selected commit. Bump both versions before another release; existing tags and releases are never overwritten. EAS continues to manage and increment the Android version code through `eas.json`.

The Play Store `production` profile remains an Android App Bundle;
`production-apk` is for direct-download APKs. Test the exact distributed artifact
before declaring a release ready.

## One-time configuration

In **Settings → Secrets and variables → Actions**, configure:

| Type                | Name                                 | Value                                                                                                          |
| ------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Secret              | `EXPO_TOKEN`                         | Expo access token for the existing `@aranlucas/grocery-agent` EAS project and its Android signing credentials. |
| Variable            | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`  | Production publishable key beginning with `pk_live_`.                                                          |
| Variable            | `EXPO_PUBLIC_COPILOTKIT_RUNTIME_URL` | Production gateway URL from `.env.example`.                                                                    |
| Variable            | `EXPO_PUBLIC_GROCERY_MARKETING_URL`  | Production marketing URL from `.env.example`.                                                                  |
| Variable (optional) | `EXPO_PUBLIC_SENTRY_DSN`             | Public runtime-error reporting DSN.                                                                            |

Keep Clerk secret keys and backend credentials on the server. Never commit a
keystore or its passwords.

The EAS project must already have Android signing credentials configured for `production-apk`; non-interactive builds cannot create missing credentials. Reuse the app's existing keystore so installed copies can be updated. Keep any matching public values in EAS's `production` environment consistent with these GitHub variables. EAS variables with Secret visibility are unavailable to local builds. See [Expo's local-build requirements](https://docs.expo.dev/build-reference/local-builds/) and [non-interactive build setup](https://docs.expo.dev/build/building-on-ci/).

GitHub provides the release token automatically through `github.token` with `contents: write`; no GitHub personal access token is needed. Sentry source-map auto-upload is disabled for this workflow. The workflow creates a draft while uploading and publishes it only after both assets succeed. If publishing fails after draft creation, inspect that draft in **Releases** and either finish publishing it or remove the failed draft (and its tag, if created) before retrying the same version.

## Local command limitation

The legacy `publish:production-apk:android` package script resolves Git operations
from two directories above the app and can overwrite assets on an existing
release. Use the workflow above for this standalone repository; do not use that
local publish helper until its repository scope and overwrite policy are repaired.
