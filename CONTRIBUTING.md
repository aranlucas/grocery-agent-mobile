# Contributing

Follow the [setup instructions](README.md#run-the-mobile-app) and project conventions
in [AGENTS.md](AGENTS.md). Regenerate shared API types from their upstream source
when contracts change; do not hand-edit generated types to hide a mismatch.

## Validation

```sh
pnpm validate
pnpm build
```

`pnpm validate` runs lint, formatting, TypeScript, Vitest, and Expo dependency
validation. `pnpm build` checks Android and iOS JavaScript exports with placeholder
public configuration; it does not produce a signed app or verify native behavior.
Use `pnpm fmt` to fix formatting.

The grocery controller lifecycle tests can be run separately with
`pnpm exec vitest run test/grocery-agent.test.mjs`. They use mocked Clerk/CopilotKit
adapters and do not exercise native UI or live services. For native changes,
follow the [UI review procedure](docs/ux/verification.md) and record actual
platform coverage in the pull request. Scale checks to the change; documentation
edits do not need native builds.

## Dependency maintenance

[Dependabot configuration](.github/dependabot.yml) groups weekly npm and GitHub
Actions updates. The [auto-merge workflow](.github/workflows/dependabot-automerge.yml)
merges eligible Dependabot PRs after CI succeeds; static CI does not establish
native compatibility. Review Expo, React Native, React, and native-module updates
together and exercise affected native flows before release.

For manual reviews, use `pnpm outdated -r`, `pnpm audit --prod`, and
`pnpm exec expo-agent-cli install --check`. Use the pinned pnpm version, commit
lockfile changes, and run the validation above. The [pre-push hook](.husky/pre-push)
can align dependencies and stop the push for review; see [README](README.md#contribute-and-release).

## Pull requests and releases

Explain the problem, resulting behavior, and checks actually executed using the
[PR template](.github/pull_request_template.md). Keep credentials, signing files,
and personal grocery/account data out of commits and issue reports. Report
vulnerabilities privately through [SECURITY.md](SECURITY.md).

Follow [RELEASING.md](RELEASING.md) for Android APK publication and recovery.
