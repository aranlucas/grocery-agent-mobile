#!/usr/bin/env bash
set -euo pipefail

# EAS passes signing credentials in a base64 job argument. Mask it before
# spawning the build so GitHub's orphan-process cleanup cannot expose it.
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  printf '::add-mask::%s\n' "$1"
fi

# Keep this version aligned with eas-cli in release-android.yml.
exec npx --yes eas-cli-local-build-plugin@21.0.0 "$1"
