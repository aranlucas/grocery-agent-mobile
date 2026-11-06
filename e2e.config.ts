import type { E2EConfig } from "e2e";
import { mobile } from "@e2e-dev/mobile";

export default {
  targets: [
    {
      name: "android",
      engine: mobile({ platform: "android" }),
      app: { bundleId: "dev.agents.grocery.e2e" },
    },
  ],
  tests: ["e2e/*.e2e.ts"],
  workers: 1,
  retries: 0,
  timeout: 120_000,
  assertionTimeout: 15_000,
  reporters: ["list", "junit"],
} satisfies E2EConfig;
