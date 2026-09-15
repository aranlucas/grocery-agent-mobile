---
name: github-actions-workflows
description: "Create and validate Expo and React Native CI/CD with GitHub Actions or another open workflow runner. Use for linting, type checks, CNG prebuilds, local Android/iOS builds, artifact uploads, static web deploys, and release gates."
license: MIT
---

# Open CI workflows

Use the repository's existing CI provider when one is present. GitHub Actions is free for standard runners in public repositories and for self-hosted runners; private repositories have plan quotas and limits. Keep provider-specific YAML small and keep build logic in checked-in scripts where possible.

## Workflow shape

1. Pin the package manager and Node version from the repository.
2. Install from the lockfile with the frozen/immutable option.
3. Run lint, formatting, type checks, and `npx expo install --check`.
4. Export web or native JavaScript bundles as a fast static gate.
5. For native artifacts, run CNG prebuild when the project uses CNG, then build with Gradle on Linux/macOS or Xcode on macOS.
6. Upload APK/AAB/IPA or web artifacts for review; publish or submit only in an explicitly authorized release job.

## Native build rules

- Use a macOS runner with full Xcode for iOS; `xcodebuild` cannot archive from Command Line Tools alone.
- Use the repository's Gradle wrapper and Java version for Android.
- Keep signing certificates and store credentials in the runner's secret store. Never commit them or print them.
- Cache package-manager and Gradle data only when the cache key includes the lockfile and relevant toolchain versions.
- Verify the artifact's identifier, version, architecture, and signing before uploading it.

## Free/open-source runners

Use GitHub-hosted runners, self-hosted runners, GitLab CI, Gitea Actions, Woodpecker CI, or a local runner such as `act` when appropriate. Free limits and hosted runner availability vary; state the applicable quota instead of promising unlimited execution.

## Workflow safety

Pull requests from forks must not receive signing or deployment secrets. Separate validation from release, require an explicit tag or protected branch for publishing, and preserve artifacts long enough to reproduce a release. Do not add a cloud build provider merely because a workflow needs an iOS runner.

## References

- GitHub Actions billing: https://docs.github.com/en/actions/concepts/billing-and-usage
- Expo local app development: https://docs.expo.dev/guides/local-app-development/
- GitHub Actions for Expo: https://docs.github.com/en/actions
- `act`: https://nektosact.com/
