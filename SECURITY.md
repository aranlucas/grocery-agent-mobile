# Security policy

## Reporting a vulnerability

Email [aranlucas@gmail.com](mailto:aranlucas@gmail.com) with the subject
`Grocery Agent security report`. This is the maintainer contact already used by
the app's report flow. Please report vulnerabilities privately before opening
a public issue or pull request.

Include the affected app version or commit, platform, a description of the
impact, and the smallest reproduction using a test account. Redact credentials,
session tokens, signing material, household details, and personal grocery data.
Do not include another person's account data in a report.

## Maintenance scope

Fixes are developed on `main`. Reports should identify whether they affect the
current source or a distributed APK. There is no published long-term support or
backport schedule for older versions.

The mobile client depends on separately operated authentication, grocery
gateway, and commerce services. Identify the affected component when possible so
the report can be directed appropriately. This policy does not attest that any
particular release or service is free of vulnerabilities.
