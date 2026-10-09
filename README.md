# Grocery Agent

[![CI](https://github.com/aranlucas/grocery-agent-mobile/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/aranlucas/grocery-agent-mobile/actions/workflows/ci.yml)
![Expo](https://img.shields.io/badge/Expo-57_stable-000020?logo=expo&logoColor=white)
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

Requirements: Node.js from .node-version, pnpm 12.6, and an Expo development build for native features. Expo Go is not compatible with this project. Android builds need an Android SDK; local iOS builds need macOS and Xcode.

```sh
pnpm install
cp .env.example .env.local
```

Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local. The CopilotKit runtime URL defaults to the production Go gateway; you can override it with EXPO_PUBLIC_COPILOTKIT_RUNTIME_URL. EXPO_PUBLIC_SENTRY_DSN and EXPO_PUBLIC_GROCERY_MARKETING_URL are optional.

Start the development server:

```sh
pnpm start
```

Use the Expo development build on a device or emulator. The repository also provides pnpm android, pnpm ios, and pnpm web scripts.


## Local URLs with Portless

This command runs the browser preview through the project's Expo Agent CLI.
The inner shell passes Portless's assigned port to Metro explicitly.

The standard development command uses [Portless](https://github.com/vercel-labs/portless).
Install its pinned CLI once with Node.js 24 or newer, then run this repository's command after the
normal dependency and environment setup:

```sh
npm install -g portless@0.15.7
pnpm web
```

The main checkout uses `https://grocery-agent-mobile.localhost` with the default proxy settings.
Use the URL printed by Portless if you have changed its proxy port, TLS, or TLD.
Linked Git worktrees get a branch prefix, so each checkout has its own origin.
The first HTTPS run can request local administrator permission to bind port 443,
trust its development certificate, and synchronize local hostnames. Ctrl+C stops
the child server and removes its route. The direct fallback below starts the
server without the proxy.

Use `pnpm web:direct` for the direct browser server; the existing `pnpm start` and native
development-build workflows remain available. `.localhost` is local to the browser
computer, so keep the existing gateway URL and connection method on phones and
emulators. Browser authentication and API calls still require a development Clerk
instance and a gateway that accepts the exact origin printed by Portless.

## Find the main pieces

- src/app/ contains the chat, lists, saved recipes, households, history, and account routes.
- src/components/grocery-chat.tsx and src/components/grocery-agent-provider.tsx connect chat to the gateway.
- src/hooks/use-grocery-agent.ts manages agent runs.
- src/hooks/use-household-api.ts handles household sharing.
- src/lib/ and src/components/ contain Kroger connection, saved resources, and list/cart flows.
- docs/ux/ contains the design system and recorded verification evidence.

Run the repository checks sequentially:

```sh
pnpm check
pnpm test
```
