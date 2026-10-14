import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const adapters = fileURLToPath(new URL("./test/helpers/grocery-agent.mjs", import.meta.url));

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: [
      { find: /^@clerk\/expo$/, replacement: adapters },
      { find: /^@copilotkit\/react-native\/headless$/, replacement: adapters },
    ],
  },
  test: {
    include: ["test/**/*.test.mjs"],
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    sequence: { concurrent: false },
  },
});
