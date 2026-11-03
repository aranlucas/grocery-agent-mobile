# Grocery Agent

[![CI](https://github.com/aranlucas/grocery-agent-mobile/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/aranlucas/grocery-agent-mobile/actions/workflows/ci.yml)
![Expo](https://img.shields.io/badge/Expo-58_stable-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-mobile-61DAFB?logo=react&logoColor=111)
![Kroger](https://img.shields.io/badge/Kroger-optional_shop_connection-004F9F)

**From “what's for dinner?” to a shared list and a Kroger-ready cart.**

Grocery Agent turns meal ideas, busy weeks, and budgets into a plan your household can shop together. Tell the agent what you want to cook, review the recipes and product matches, then connect Kroger when you are ready to shop.

![Illustration of fresh groceries becoming a checked shared shopping list](docs/images/readme-cover.png)

_Concept artwork for Grocery Agent; it is not a product screenshot._

## Make the plan, then make it yours

Start with a request like:

> Plan five practical dinners for two people with a $100 grocery budget.

1. **Plan in chat.** Ask for meal ideas, recipes, or a grocery list and refine the plan through conversation.
2. **Review the list.** Check the items, quantities, and matched products before shopping.
3. **Shop when ready.** Kroger connection is optional. Connect an account to see live products and prices and send confirmed matches to the cart.
4. **Save the good stuff.** Keep lists and recipes, share them with a household, and reopen a past chat when plans change.

## Run the mobile app

Requirements: Node.js from [.node-version](.node-version), pnpm from [package.json](package.json), and an Expo development build for native features. Expo Go is not compatible with this project. Android builds need an Android SDK; local iOS builds need macOS and Xcode.

```sh
pnpm install
cp .env.example .env.local
```

Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local`. With no runtime URL override, a `pk_test_` key selects the development gateway; other keys use the production gateway. Set `EXPO_PUBLIC_COPILOTKIT_RUNTIME_URL` explicitly to override that choice. `EXPO_PUBLIC_SENTRY_DSN` and `EXPO_PUBLIC_GROCERY_MARKETING_URL` are optional.

Start the development server:

```sh
pnpm start
```

Use `pnpm exec expo-agent-cli dev --android` or `pnpm exec expo-agent-cli dev --ios` to prepare and open a native development build. `pnpm web` serves the browser build at `https://grocery-mobile.localhost` through [Portless](https://github.com/vercel-labs/portless) (a dev dependency); its first run may ask for `sudo` to bind port 443 and trust a local certificate.

## Contribute and release

See [contributing](CONTRIBUTING.md) for validation and dependency maintenance,
[Android releases](RELEASING.md) for signing and publication, and the
[roadmap](ROADMAP.md) for proposed product priorities. UI changes follow the
[design rationale](docs/ux/design-system.md) and [review procedure](docs/ux/verification.md).

Run the repository checks sequentially:

```sh
pnpm check
pnpm test
```

Husky’s `pre-push` hook runs Expo’s SDK-compatible dependency alignment and Doctor. If Expo
updates `package.json` or `pnpm-lock.yaml`, the push stops so you can review and
commit both files, then push again. Existing staged or unstaged dependency edits
are left untouched; commit or stash them before pushing. Network or resolver
failures also block the push.
