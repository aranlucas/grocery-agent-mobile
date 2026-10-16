import { format } from "@aranlucas/oxforge/format";

export default format({
  ignorePatterns: [
    "AGENTS.md",
    "android/**",
    "ios/**",
    "src/lib/grocery-gateway.d.ts",
    "src/uniwind-types.d.ts",
    "pnpm-lock.yaml",
  ],
  sortTailwindcss: { stylesheet: "./src/global.css" },
});
