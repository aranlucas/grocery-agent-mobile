import assert from "node:assert/strict";
import { test } from "node:test";
import { waitForKrogerConnection } from "../src/lib/connections.ts";

void test("a rejected Kroger callback reports the account conflict without polling to a timeout", async () => {
  let reloads = 0;
  await assert.rejects(
    waitForKrogerConnection({
      reload: async () => {
        reloads += 1;
        return {
          externalAccounts: [
            {
              provider: "oauth_custom_shopping",
              verification: {
                status: "unverified",
                error: { code: "oauth_identification_claimed" },
              },
            },
          ],
        };
      },
      waitForDelay: async () => {},
    }),
    /already registered to another Grocery Agent account/,
  );
  assert.equal(reloads, 1);
});

void test("a pending Kroger callback keeps polling and ignores errors from unrelated providers", async () => {
  let reloads = 0;
  const user = await waitForKrogerConnection({
    reload: async () => ({
      externalAccounts: [
        {
          provider: "oauth_google",
          verification: { status: "unverified", error: { message: "Unrelated failure" } },
        },
        {
          provider: "custom_shopping",
          verification: { status: ++reloads === 2 ? "verified" : "unverified" },
        },
      ],
    }),
    waitForDelay: async () => {},
  });
  assert.equal(reloads, 2);
  assert.equal(user.externalAccounts[1].verification.status, "verified");
});

void test("a verified Kroger connection wins over a stale verification error", async () => {
  const user = {
    externalAccounts: [
      {
        provider: "oauth_custom_shopping",
        verification: {
          status: "verified",
          error: { code: "oauth_identification_claimed" },
        },
      },
    ],
  };
  assert.equal(
    await waitForKrogerConnection({ reload: async () => user, waitForDelay: async () => {} }),
    user,
  );
});
