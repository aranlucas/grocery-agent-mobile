---
name: self-hosted-expo-web
description: "Export and host Expo web apps and Router API routes on open or self-managed infrastructure. Use for static hosting, Node/Bun servers, Cloudflare Workers, container deployment, domains, environment variables, and local web previews."
license: MIT
---

# Self-hosted Expo web

Keep the web bundle and its runtime separate. A static export can be served by any HTTP server or static host; Expo Router API routes need a server or edge runtime and cannot be served by a static file server alone.

## Static web app

1. Inspect `app.json`/`app.config.*`, `package.json`, the router output mode, and required public environment variables.
2. Test locally with `npx expo start --web`.
3. Produce the deployment artifact with `npx expo export --platform web`.
4. Serve the output with an existing Nginx/Caddy server, a container, or a static host such as GitHub Pages, Cloudflare Pages, Netlify, or an S3-compatible bucket. Choose the host already used by the project; do not add provider-specific configuration speculatively.
5. Configure SPA fallback behavior, cache headers, HTTPS, custom domains, and environment variables at the selected host.

Static hosting is appropriate only when the exported output contains no server-only routes. Never expose secrets through `EXPO_PUBLIC_*` variables.

## API routes

Expo Router `+api.ts` handlers run on the server. Choose a compatible runtime before writing deployment files:

- Node.js or Bun: package the server output and run it behind a reverse proxy.
- Cloudflare Workers: adapt the output to the Workers runtime and configure bindings in the host project.
- Any other compatible server: preserve the framework's request/response contract and provide CORS, health checks, logs, and secret injection.

Test an API route locally with `curl` against the running server. Validate HTTP methods, authentication, CORS, error responses, and cache behavior before deployment.

## Free/open-source defaults

Prefer local `expo export`, GitHub Actions, Docker/Podman, Nginx, Caddy, and self-managed object storage. Free hosted tiers may change; verify current limits before recommending one. Do not treat a provider's free tier as an open-source guarantee.

## References

- Expo web deployment: https://docs.expo.dev/deploy/web/
- Expo Router API routes: https://docs.expo.dev/router/web/api-routes/
- Caddy: https://caddyserver.com/docs/
- Nginx: https://nginx.org/en/docs/
