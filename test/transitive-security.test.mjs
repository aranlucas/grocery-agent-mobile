import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "vitest";

const require = createRequire(import.meta.url);
const routerRequire = createRequire(require.resolve("expo-router"));
const { parseQueryParams } = routerRequire("expo-router/build/fork/getStateFromPath-forks.js");
const { stringifySearchParams } = routerRequire("expo-router/build/utils/queryParams.js");

function readPackageManifest(entry, name) {
  let directory = dirname(entry);
  while (true) {
    try {
      const manifest = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
      if (manifest.name === name) return manifest;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const parent = dirname(directory);
    assert.notEqual(parent, directory, `Could not find ${name}'s package manifest`);
    directory = parent;
  }
}

test("Expo Router parses query strings without the removed decoder dependency", () => {
  const routerManifest = readPackageManifest(require.resolve("expo-router"), "expo-router");
  assert.equal(routerManifest.dependencies?.["query-string"], undefined);
  const lockfile = readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");
  assert.doesNotMatch(lockfile, /^  ['"]?(?:query-string|decode-uri-component)@/mu);
  const parse = (query) => parseQueryParams(`/chat?${query}`, { name: "chat" });
  assert.deepEqual(
    { ...parse("name=hello%20world&utf8=%F0%9F%91%8B&plus=a+b") },
    { name: "hello world", utf8: "👋", plus: "a b" },
  );
  assert.deepEqual({ ...parse("a=1&a=2") }, { a: ["1", "2"] });
  assert.deepEqual(
    { ...parse(stringifySearchParams({ name: "hello world", utf8: "👋" })) },
    { name: "hello world", utf8: "👋" },
  );
  assert.doesNotThrow(() => parse(`x=${"%E0%A4%A".repeat(10000)}`));
});

test("Expo config plugins generate unique Xcode project IDs", () => {
  const expoRequire = createRequire(require.resolve("expo"));
  const pluginsRequire = createRequire(expoRequire.resolve("@expo/config-plugins"));
  // Xcode uses v4() without an output buffer. The v3/v5/v6 buffer-bounds
  // advisory (GHSA-w5hq-g745-h8pq) does not affect this build-time path.
  const project = pluginsRequire("xcode").project("example.pbxproj");
  project.hash = { project: { objects: {} } };
  const ids = new Set(Array.from({ length: 1000 }, () => project.generateUuid()));
  assert.equal(ids.size, 1000);
  for (const id of ids) assert.match(id, /^[A-F0-9]{24}$/u);
});

test("Clerk's optional Solana client is absent or preserves safe single and batch requests", async () => {
  let dependencyRequire = require;
  for (const dependency of ["@clerk/expo", "@clerk/clerk-js"]) {
    dependencyRequire = createRequire(dependencyRequire.resolve(dependency));
  }
  try {
    dependencyRequire.resolve("@solana/wallet-adapter-base");
  } catch (error) {
    assert.equal(error.code, "MODULE_NOT_FOUND");
    assert.match(error.message, /Cannot find module '@solana\/wallet-adapter-base'/u);
    const clerkManifest = readPackageManifest(
      dependencyRequire.resolve("@clerk/clerk-js"),
      "@clerk/clerk-js",
    );
    assert.equal(clerkManifest.dependencies?.["@solana/wallet-adapter-base"], undefined);
    const lockfile = readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");
    assert.doesNotMatch(lockfile, /^  ['"]?(?:@solana\/wallet-adapter-base|jayson)@/mu);
    console.info("The installed Clerk version and lockfile do not include Solana or jayson.");
    return;
  }
  // Retain the behavioral regression if a future Clerk version restores this
  // optional integration; absence must not require installing it just to test.
  for (const dependency of ["@solana/wallet-adapter-base", "@solana/web3.js"]) {
    dependencyRequire = createRequire(dependencyRequire.resolve(dependency));
  }
  assert.ok(Number.parseInt(dependencyRequire("jayson/package.json").version, 10) >= 5);
  const Client = dependencyRequire("jayson/lib/client/browser");
  const client = new Client((payload, callback) => {
    const request = JSON.parse(payload);
    const respond = (item) => ({ jsonrpc: "2.0", id: item.id, result: item.method });
    callback(
      null,
      JSON.stringify(Array.isArray(request) ? request.map(respond) : respond(request)),
    );
  });
  const single = await new Promise((resolve, reject) => {
    client.request("getHealth", [], (error, result) => (error ? reject(error) : resolve(result)));
  });
  assert.equal(single.result, "getHealth");
  assert.match(single.id, /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/iu);
  const batch = [client.request("getHealth", []), client.request("getVersion", [])];
  const result = await new Promise((resolve, reject) => {
    client.request(batch, (error, response) => (error ? reject(error) : resolve(response)));
  });
  assert.deepEqual(
    result,
    batch.map((item) => ({ jsonrpc: "2.0", id: item.id, result: item.method })),
  );
});
