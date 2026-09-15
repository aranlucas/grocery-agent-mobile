# Repository readiness

Prepared on 2026-09-15 using Shipshape's action plan, readiness audit, and branch
risk inspection, followed by local inspection and authenticated GitHub reads.
The public audit examined
[`fba17db`](https://github.com/aranlucas/grocery-agent-mobile/commit/fba17db751440e70fa9c63f0d13ebbd9e16518ee).
Shipshape is read-only; the changes described below are local preparation and
take effect on GitHub after publication. Repository settings were not changed.

## Prepared locally

| Rule ID                                                                           | Observed state / confidence                                             | Preparation and evidence                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `delivery.workflow-pinning`                                                       | Shipshape unknown / low; local inspection confirmed mutable tags / high | Pinned every external action in [CI](../.github/workflows/ci.yml), [Android release](../.github/workflows/release-android.yml), and [CodeQL](../.github/workflows/codeql.yml) to full upstream commit SHAs, retaining version comments. CI checkout no longer persists credentials.  |
| `security.code-scanning`                                                          | Shipshape unknown / low; GitHub default setup not configured / high     | Added a JavaScript/TypeScript CodeQL workflow for PRs, `main`, weekly runs, and manual dispatch. Verify its first successful run and findings in [code scanning](https://github.com/aranlucas/grocery-agent-mobile/security/code-scanning) after publication.                        |
| `standards.baseline`, `standards.format`, `standards.lint`, `standards.typecheck` | Missing or incompletely detected declarations / high                    | Added [.shipshape.yml](../.shipshape.yml) with the pinned baseline and real pnpm commands. Root commands cover the workspace. Four dated exceptions cover lint/typecheck rules for JSON-only configuration packages; these are exemptions, not passing checks. Review by 2026-12-15. |
| `standards.updates`, `delivery.dependency-updates`                                | Missing update configuration locally / high                             | Added [weekly Dependabot updates for GitHub Actions](../.github/dependabot.yml). App dependency updates remain manual; see the compatibility limitation below.                                                                                                                       |
| `public.contributing`, `public.security-policy`, `security.security-policy`       | Shipshape unknown / low; local files absent / high                      | Added [CONTRIBUTING.md](../CONTRIBUTING.md), [SECURITY.md](../SECURITY.md), and a [PR template](../.github/pull_request_template.md). Private reporting uses the existing app maintainer address.                                                                                    |

## Remaining queue

The following work requires repository administration, a licensing decision, or
additional engineering. The order reflects severity and practical value.

| Priority | Rule ID                                                                                                     | State / confidence                       | Evidence and smallest next step                                                                                                                                                                                                                                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | `branch.default-protection`                                                                                 | Fail / high                              | GitHub reports `main` as unprotected and returns no rulesets. In [branch settings](https://github.com/aranlucas/grocery-agent-mobile/settings/branches), protect `main` against force pushes and deletion. Require the existing `Check grocery app` CI check; add the CodeQL check after its first successful run. Choose review requirements that fit the project's maintainer workflow.      |
| High     | `public.license`                                                                                            | Fail / high                              | [GitHub detects no license](https://github.com/aranlucas/grocery-agent-mobile). Existing configuration packages declare `PROPRIETARY`. The owner must choose the repository's licensing policy before a root license is added.                                                                                                                                                                 |
| High     | `security.dependabot`                                                                                       | Security updates disabled / high         | Authenticated repository metadata reports Dependabot security updates disabled. Review [security settings](https://github.com/aranlucas/grocery-agent-mobile/settings/security_analysis), enable supported security update coverage, and verify the first update. Do not assume pnpm 12 lockfile support.                                                                                      |
| Medium   | `standards.test`                                                                                            | Fail / high                              | [The audited commit](https://github.com/aranlucas/grocery-agent-mobile/commit/fba17db751440e70fa9c63f0d13ebbd9e16518ee) deliberately removed test tooling. No replacement test command or exemption was added. Keep the runtime coverage gap visible; a future testing decision should target consequential behavior such as authentication, cart/list mutations, or release guards.           |
| Medium   | `standards.updates`, `delivery.dependency-updates`                                                          | Partial ecosystem coverage / high        | [GitHub's support table](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories) lists pnpm v7–v10; this app uses v12.4.2. Follow [manual app dependency review](../CONTRIBUTING.md#dependency-maintenance) and recheck support before enabling the npm updater. A configuration-presence pass does not prove app dependency coverage. |
| Medium   | `delivery.merge-commits-disabled`, `delivery.rebase-merging-disabled`, `delivery.update-branches-suggested` | Do not meet Shipshape preferences / high | Authenticated [repository settings](https://github.com/aranlucas/grocery-agent-mobile/settings) show merge commits and rebase merging enabled, and update-branch suggestions disabled. If adopting these Shipshape preferences, keep squash merging enabled, disable the other merge methods, and enable branch-update suggestions.                                                            |
| Medium   | `delivery.release`, `public.release-notes`                                                                  | No published release / high              | The [releases list](https://github.com/aranlucas/grocery-agent-mobile/releases) is empty. Use the existing manual APK workflow once release configuration and native verification are complete; local exports do not establish signed-release readiness.                                                                                                                                       |
| Low      | `public.topics`                                                                                             | Fail / high                              | The [repository](https://github.com/aranlucas/grocery-agent-mobile) has no topics. Suggested topics: `expo`, `react-native`, `typescript`, `grocery`, `kroger`, `copilotkit`.                                                                                                                                                                                                                  |

## Confirmed controls and evidence limits

- `delivery.ci-present` and `delivery.ci-green`: pass, high confidence. The
  [latest CI run for the audited commit](https://github.com/aranlucas/grocery-agent-mobile/actions/runs/35021831916)
  succeeded. This is evidence for that commit, not a GitHub run of this local change.
- `security.secret-scanning` and `security.push-protection`: Shipshape reported
  unknown because its endpoints were permission-limited. Authenticated repository
  metadata confirmed both features enabled. Alert contents were not inspected;
  enabled controls do not establish absence of exposed secrets.
- `standards.lockfile`: Shipshape v1 cannot verify ancestor lockfile membership.
  The root `pnpm-lock.yaml` contains importers for all three `packages/*`
  workspaces; no nested lockfiles are needed.
- `standards.strict`: `packages/types` inherits `strict: true` from
  `packages/typescript-config/base.json`. Root TypeScript configuration also
  enables strict mode and includes workspace TypeScript files. Inheritance can
  remain unknown to Shipshape's static evaluator.
- `standards.ci-gates`: `pnpm validate` expands to lint, formatting, TypeScript,
  and Expo validation; CI also runs both native exports. Shipshape v1 cannot
  fully resolve cross-workspace command invocations, and no runtime test gate
  exists. Preserve those unknowns rather than adding empty checks.

## Verification

Completed locally on 2026-09-15:

- `pnpm validate`: passed type-aware lint, formatting, strict TypeScript checks,
  and Expo dependency validation.
- `pnpm build`: passed Android and iOS exports, including metadata and non-empty
  bundle checks.
- Actionlint v1.7.12: passed all three GitHub Actions workflows.
- YAML/configuration checks: parsed five YAML files and verified all four
  workspace command mappings and lockfile importers, four dated exceptions, and
  all eleven full-SHA Action references. The release workflow remains manual.
- `git diff --check`: passed.

No app runtime source or native flow was changed. Native emulator and signed APK
verification were not run; they remain necessary for future changes that affect
those flows and for release readiness. CodeQL analysis and Dependabot execution
must be verified on GitHub after publication.

After these files are published, rerun Shipshape's `action_plan` and
`standards_audit` against the new default-branch commit. Confirm actual workflow
execution and review unresolved checks individually; an aggregate score can hide
unknown evidence.
