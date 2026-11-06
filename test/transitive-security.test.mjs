import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "vitest";

const require = createRequire(import.meta.url);
const routerRequire = createRequire(require.resolve("expo-router"));
const { parseQueryParams } = routerRequire("expo-router/build/fork/getStateFromPath-forks.js");
const { stringifySearchParams } = routerRequire("expo-router/build/utils/queryParams.js");

test("Expo Router preserves Unicode and repeated query parameters and tolerates malformed escapes", () => {
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
