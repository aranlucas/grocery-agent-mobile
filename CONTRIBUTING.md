# Contributing

## Setup and checks

Use Node.js from `.node-version` and the exact pnpm version in `package.json`'s
`packageManager` field. Copy `.env.example` to `.env.local` and configure the
Clerk publishable key, CopilotKit runtime, Sentry DSN, and public grocery marketing
URL. Native builds use `app.json` and `eas.json`; Expo Go does not provide the
complete native-client experience.

Start development with `pnpm start`, run native builds with `pnpm android` or
`pnpm ios`, or start the web version with `pnpm web`.

```bash
pnpm install --frozen-lockfile
pnpm validate
pnpm build
```

`pnpm validate` runs type-aware lint, formatting, strict TypeScript checks, and
Expo dependency validation. Root lint, formatting, and TypeScript checks include
the workspace packages. `pnpm build` checks Android and iOS JavaScript exports
with placeholder public configuration; it does not produce a signed app or
verify runtime behavior. Use `pnpm fmt` to fix formatting before validation.

There is currently no automated runtime test suite. For changes to native flows,
record emulator/device results in the pull request: keyboard avoidance, Android
back navigation, accessibility labels, dark mode, reduced motion, and narrow and
wide layouts. State which platforms and checks were actually exercised.

## App conventions

Follow [AGENTS.md](AGENTS.md). In particular:

- Use Uniwind and Tailwind v4 semantic tokens with the source-owned primitives
  in `src/components/ui/`.
- Use React Hook Form and the shared adapters for submit flows; keep transient
  UI state local.
- Keep native headers and toolbars in Expo Router and grocery behavior in domain
  components.
- Preserve responsive gutters, centered content, automatic scroll insets, and
  accessible standalone touch targets.
- Regenerate shared API types from their upstream source when contracts change;
  do not hand-edit generated types to hide a mismatch.

## Dependency maintenance

Dependabot checks pinned GitHub Actions weekly. App dependency updates remain a
manual maintenance step: GitHub's [supported ecosystem documentation](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories)
currently lists pnpm through v10, while this repository uses pnpm v12. Recheck
support before enabling npm ecosystem updates, and verify the first generated
lockfile update. The presence of `.github/dependabot.yml` does not mean every
package is covered by automatic updates.

Review app dependencies weekly and when an advisory affects the app:

```bash
pnpm outdated -r
pnpm audit --prod
pnpm exec expo install --check
```

Review Expo, React Native, React, and native-module compatibility together. Make
focused updates using the repository's pnpm version, commit the lockfile, run
`pnpm validate` and `pnpm build`, and exercise affected native flows. Review
GitHub Action major-version changes before merging. Do not enable automatic
merging solely because a dependency update passes static checks.

## Pull requests and releases

Create a focused branch and explain the problem, resulting behavior, and actual
validation. Keep credentials, signing files, and personal grocery/account data
out of commits and issue reports. Use [SECURITY.md](SECURITY.md) for private
vulnerability reports.

The Android APK release workflow is manually dispatched. Follow [the release
instructions](#android-releases), including matching app/package
versions and an unused tag. JavaScript export checks alone do not establish
release readiness.

## Android releases

The **Release Android APK** workflow in `.github/workflows/release-android.yml` runs only when manually dispatched through **Actions → Release Android APK → Run workflow** or the GitHub CLI. Select the branch to build (or pass a branch/tag with `gh workflow run --ref`) and optionally mark the release as a prerelease. Pushes to `main` and pull requests run the separate validation and export CI workflow; they do not build or publish APKs.

The release workflow validates the selected commit, builds a signed APK on the GitHub runner using the existing EAS `production-apk` profile, and publishes these assets in the repository's **Releases** tab:

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
