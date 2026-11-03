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
