// Run the actual app screens with deterministic local data in a separate workspace.
// No production imports, authentication bypass, or live API writes are involved.
import { cpSync, rmSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
const source = resolve(import.meta.dirname, "..");
const target = mkdtempSync(join(tmpdir(), "grocery-ui-review-"));
for (const name of [
  "src",
  "index.js",
  "app.json",
  "app.config.js",
  "metro.config.js",
  "tsconfig.json",
  "package.json",
  "assets",
  "plugins",
])
  cpSync(join(source, name), join(target, name), { recursive: true });
for (const name of ["node_modules", "packages"])
  symlinkSync(join(source, name), join(target, name), "dir");
cpSync(join(source, "scripts/ui-review/fixtures.jsx"), join(target, "src/review-fixtures.jsx"));
cpSync(join(source, "scripts/ui-review/clerk.jsx"), join(target, "src/review-clerk.jsx"));
for (const name of [
  "components/grocery-agent-provider",
  "components/grocery-copilot-session",
  "hooks/use-household-api",
  "hooks/use-grocery-agent",
  "hooks/use-kroger-connection",
]) {
  rmSync(join(target, `src/${name}.ts`), { force: true });
  writeFileSync(join(target, `src/${name}.tsx`), 'export * from "@/review-fixtures";\n');
}
writeFileSync(
  join(target, "src/lib/sentry.ts"),
  "export const Sentry = { wrap: (component) => component, captureException: () => {} };\n",
);
writeFileSync(
  join(target, "metro.config.js"),
  `const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const config = getDefaultConfig(__dirname);
config.watchFolders = [${JSON.stringify(source)}];
config.resolver.resolveRequest = (context, name, platform) => {
  if (name === '@clerk/expo') return { type: 'sourceFile', filePath: require('node:path').join(__dirname, 'src/review-clerk.jsx') };
  return context.resolveRequest(context, name, platform);
};
module.exports = withUniwindConfig(config, { cssEntryFile: './src/global.css', dtsFile: './src/uniwind-types.d.ts', polyfills: { rem: 14 } });
`,
);
mkdirSync(join(target, ".expo"), { recursive: true });
console.log(
  `UI review workspace: ${target}\nLocal sample data only. Set scenarios using globalThis.__groceryReview.scenario('empty' | 'error' | 'content' | 'connected' | 'chat-error').`,
);
const child = spawn(
  join(source, "node_modules/.bin/expo-agent-cli"),
  ["start", "--dev-client", "--port", "8082"],
  {
    cwd: target,
    env: {
      ...process.env,
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k",
      EXPO_PUBLIC_COPILOTKIT_RUNTIME_URL: "https://example.invalid",
      EXPO_PUBLIC_SENTRY_DSN: "",
    },
    stdio: "inherit",
  },
);
child.on("exit", (code) => process.exit(code ?? 0));
