import base from "@aranlucas/oxforge/format-tailwind";

export default {
  ...base,
  ignorePatterns: [
    ...(base.ignorePatterns ?? []),
    "AGENTS.md",
    "android/**",
    "ios/**",
    "src/lib/grocery-gateway.d.ts",
    "src/uniwind-types.d.ts",
    "pnpm-lock.yaml",
  ],
  sortTailwindcss: { ...base.sortTailwindcss, stylesheet: "./src/global.css" },
};
