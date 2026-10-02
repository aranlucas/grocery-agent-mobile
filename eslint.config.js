// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const { fixupConfigRules } = require("@eslint/compat");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  // Expo's React rules still use context methods removed in ESLint 10.
  ...fixupConfigRules(expoConfig),
  eslintPluginPrettierRecommended,
  {
    ignores: [
      "src/lib/grocery-gateway.d.ts",
      "src/uniwind-types.d.ts",
      ".expo/**",
      ".claude/**",
      ".agents/**",
      "android/**",
      "ios/**",
      "dist/**",
      "coverage/**",
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      "no-debugger": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
    },
  },
  {
    files: ["src/components/ui/**"],
    rules: {
      "react-hooks/immutability": "off",
      "import/namespace": "off",
    },
  },
  {
    // Copied into a generated app where `@/review-fixtures` exists; see scripts/ui-review.mjs.
    files: ["scripts/ui-review/**"],
    rules: {
      "import/no-unresolved": "off",
    },
  },
  {
    files: ["src/components/ui/form.tsx", "src/hooks/use-grocery-agent.ts"],
    rules: {
      "react-hooks/refs": "off",
    },
  },
]);
