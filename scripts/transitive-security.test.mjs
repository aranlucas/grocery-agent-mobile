import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const routerRequire = createRequire(require.resolve("expo-router"));
const queryRequire = createRequire(routerRequire.resolve("query-string"));
const queryString = routerRequire("query-string");

void test("Expo Router query strings use the patched decoder with CommonJS interop", () => {
  const decoder = queryRequire("decode-uri-component");
  assert.equal(typeof decoder.default, "function");
  assert.deepEqual(
    { ...queryString.parse("name=hello%20world&utf8=%F0%9F%91%8B&plus=a+b") },
    { name: "hello world", utf8: "👋", plus: "a b" },
  );
  assert.deepEqual({ ...queryString.parse("a=1&a=2") }, { a: ["1", "2"] });
  assert.deepEqual(
    { ...queryString.parse(queryString.stringify({ name: "hello world", utf8: "👋" })) },
    { name: "hello world", utf8: "👋" },
  );
  assert.doesNotThrow(() => queryString.parse(`x=${"%E0%A4%A".repeat(10000)}`));
});

void test("Expo config plugins generate Xcode project IDs with patched UUID", () => {
  const expoRequire = createRequire(require.resolve("expo"));
  const pluginsRequire = createRequire(expoRequire.resolve("@expo/config-plugins"));
  const xcodePath = pluginsRequire.resolve("xcode");
  const xcodeRequire = createRequire(xcodePath);
  const [major, minor, patch] = xcodeRequire("uuid/package.json").version.split(".").map(Number);
  assert.ok(major > 11 || (major === 11 && (minor > 1 || (minor === 1 && patch >= 1))));
  const project = pluginsRequire("xcode").project("example.pbxproj");
  project.hash = { project: { objects: {} } };
  const ids = new Set(Array.from({ length: 1000 }, () => project.generateUuid()));
  assert.equal(ids.size, 1000);
  for (const id of ids) assert.match(id, /^[A-F0-9]{24}$/u);
});

void test("Clerk's Solana JSON-RPC client preserves single and batch requests", async () => {
  let dependencyRequire = require;
  for (const dependency of [
    "@clerk/expo",
    "@clerk/clerk-js",
    "@solana/wallet-adapter-base",
    "@solana/web3.js",
  ]) {
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
