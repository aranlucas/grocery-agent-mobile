import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

export const profileName = "feel-simulator";
export const bundleId = "dev.agents.grocery.feelpilot";
export const pilotDirectory = "dist/feel-pilot";

export function validateProfile(resolved, eas) {
  assert.equal(resolved.platform, "ios");
  assert.equal(resolved.profile, profileName);
  assert.equal(resolved.submitProfile, null);
  const { ios, ...common } = eas.build[profileName];
  assert.deepEqual(resolved.buildProfile, {
    credentialsSource: "remote",
    ...common,
    ...ios,
  });
  const profile = resolved.buildProfile;
  assert.equal(profile.distribution, "internal");
  assert.equal(profile.simulator, true);
  assert.equal(profile.withoutCredentials, true);
  assert.equal(profile.developmentClient, false);
  assert.equal(profile.buildConfiguration, "Release");
  assert.equal(profile.autoIncrement, false);
  assert.equal(profile.node, "24.18.1");
  assert.equal(profile.pnpm, "12.8.1");
  assert.equal(profile.env.GROCERY_FEEL_SIMULATOR, "1");
  return profile;
}

export function validateDispatch(plan, profile, ref) {
  // Validate the rnd wire contract, then build only the checked-in profile.
  // Dispatch input never becomes shell code, environment, or a checkout ref.
  for (const [key, value] of Object.entries({
    simulator: "true",
    without_credentials: "true",
    development_client: "false",
    distribution: "internal",
    build_configuration: "Release",
    export_method: "",
    node_version: profile.node,
    package_manager: "pnpm",
    auto_increment: "false",
    prebuild_command: "",
  })) {
    assert.equal(plan[key], value, `Unsupported Deploy plan: ${key}`);
  }
  assert.deepEqual(JSON.parse(plan.env_json), profile.env);
  assert.equal(plan.ref, ref.replace(/^refs\/heads\//u, ""));
}

export function buildEnvironment(profile, source = process.env) {
  // Do not inherit .env, auth, Sentry, signing, backend, or GitHub credentials.
  const env = Object.fromEntries(
    ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "SHELL", "DEVELOPER_DIR"].flatMap((key) =>
      source[key] ? [[key, source[key]]] : [],
    ),
  );
  return {
    ...env,
    ...profile.env,
    CI: "1",
    NODE_ENV: "production",
    DO_NOT_TRACK: "1",
    RND_TELEMETRY_DISABLED: "1",
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
    EXPO_PUBLIC_COPILOTKIT_RUNTIME_URL: "https://example.invalid/copilotkit",
    EXPO_PUBLIC_GROCERY_MARKETING_URL: "https://example.invalid/grocery",
    EXPO_PUBLIC_SENTRY_DSN: "",
    SENTRY_DISABLE_AUTO_UPLOAD: "true",
    // Sentry resolves the CLI before checking its upload-disable flag. A local
    // failure command bypasses that resolution and can never upload anything.
    SENTRY_CLI_EXECUTABLE: "/usr/bin/false",
  };
}

function main() {
  const action = process.argv[2];
  assert.ok(["check", "build", "verify"].includes(action), "Use check, build, or verify");
  const root = process.cwd();
  const output = resolve(root, pilotDirectory);
  mkdirSync(output, { recursive: true });
  const eas = JSON.parse(readFileSync("eas.json", "utf8"));
  const resolved = JSON.parse(readFileSync(join(output, "resolved-profile.json"), "utf8"));
  const profile = validateProfile(resolved, eas);
  if (process.env.FEEL_DISPATCH_PLAN) {
    assert.equal(process.env.FEEL_DISPATCH_PLATFORM, "ios");
    assert.equal(process.env.FEEL_DISPATCH_PROFILE, profileName);
    assert.equal(process.env.FEEL_DISPATCH_RUNNER, "macos-26");
    validateDispatch(JSON.parse(process.env.FEEL_DISPATCH_PLAN), profile, process.env.GITHUB_REF);
  }
  if (action === "check") {
    console.log("Verified Deploy 0.3.0 resolved unsigned iOS simulator profile.");
    return;
  }
  const env = buildEnvironment(profile);
  function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
      cwd: root,
      env,
      stdio: "inherit",
      ...options,
    });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, `${command} failed (${result.status})`);
    return result.stdout;
  }
  const derived = join(output, "derived");
  if (action === "build") {
    assert.equal(process.versions.node.split(".")[0], "24", "Use the repository's Node 24");
    // Match the audited Deploy simulator path: CNG, Pods, unsigned xcodebuild,
    // and a tar archive that preserves bundle symlinks. No archive/export IPA.
    run("pnpm", ["exec", "expo", "prebuild", "--platform", "ios", "--no-install"]);
    run("pod", ["install"], { cwd: join(root, "ios") });
    const workspaces = readdirSync("ios").filter((name) => name.endsWith(".xcworkspace"));
    assert.equal(workspaces.length, 1, "Expected one generated Xcode workspace");
    const scheme = workspaces[0].replace(/\.xcworkspace$/u, "");
    run("xcodebuild", [
      "build",
      "-workspace",
      join("ios", workspaces[0]),
      "-scheme",
      scheme,
      "-configuration",
      "Release",
      "-destination",
      "generic/platform=iOS Simulator",
      "-derivedDataPath",
      derived,
      "-jobs",
      "2",
      "CODE_SIGNING_ALLOWED=NO",
    ]);
  }
  const products = join(derived, "Build/Products/Release-iphonesimulator");
  const apps = readdirSync(products).filter((name) => name.endsWith(".app"));
  assert.equal(apps.length, 1, "Expected one Release simulator app");
  const app = join(products, apps[0]);
  const info = JSON.parse(
    run("plutil", ["-convert", "json", "-o", "-", join(app, "Info.plist")], {
      stdio: ["ignore", "pipe", "inherit"],
      encoding: "utf8",
    }),
  );
  assert.equal(info.CFBundleIdentifier, bundleId);
  assert.equal(info.CFBundleVersion, "1");
  assert.equal(info.DTPlatformName, "iphonesimulator");
  assert.ok(info.CFBundleSupportedPlatforms.includes("iPhoneSimulator"));
  assert.equal(info.UIApplicationSceneManifest?.UIApplicationSupportsMultipleScenes, false);
  assert.equal(
    info.UIApplicationSceneManifest?.UISceneConfigurations?.UIWindowSceneSessionRoleApplication?.[0]
      ?.UISceneDelegateClassName,
    "EXExpoAppSceneDelegate",
    "Simulator app must adopt Expo's scene lifecycle",
  );
  assert.equal(existsSync(join(app, "embedded.mobileprovision")), false);
  assert.equal(existsSync(join(app, "_CodeSignature")), false);
  assert.ok(existsSync(join(app, "main.jsbundle")), "Release app needs its embedded JS bundle");
  const architectures = run("lipo", ["-archs", join(app, info.CFBundleExecutable)], {
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
  }).trim();
  assert.ok(architectures.split(/\s+/u).includes("arm64"));
  const archive = join(output, "GroceryAgentFeelPilot-simulator.tar.gz");
  run("tar", ["-czf", archive, "-C", products, apps[0]]);
  writeFileSync(
    join(output, "artifact.json"),
    // Simulator Mach-O files may retain automatic ad hoc linker signatures;
    // this build has no developer signing identity or device provisioning.
    `${JSON.stringify({ app, archive, bundleId, version: info.CFBundleShortVersionString, buildNumber: info.CFBundleVersion, platform: info.DTPlatformName, architectures, deviceSigned: false, codeSigningAllowed: false, embeddedBundle: true }, null, 2)}\n`,
  );
  console.log(`Verified unsigned simulator artifact: ${archive}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
