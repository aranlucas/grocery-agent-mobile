import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const adapters = fileURLToPath(
  new URL("./scripts/test-support/grocery-agent.mjs", import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@clerk\/expo$/, replacement: adapters },
      { find: /^@copilotkit\/react-native\/headless$/, replacement: adapters },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  test: {
    include: ["scripts/**/*.test.mjs"],
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    sequence: { concurrent: false },
  },
});
