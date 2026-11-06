import { QueryClient } from "@tanstack/react-query";
import { expect, test, vi } from "vitest";
import { listMutationOptions } from "../src/lib/list-mutations";
import { groceryQueryKeys } from "../src/lib/query-keys";

// An edit must refresh both representations of a list without expiring another
// user's or household's data. Use the real mutation cache and query client.
test.each([
  [{ type: "add", name: "Milk" }, "addItems", ["list", [{ name: "Milk" }]]],
  [
    { type: "toggle", itemId: "milk", checked: true },
    "updateItem",
    ["list", "milk", { checked: true }],
  ],
  [{ type: "delete", itemId: "milk" }, "deleteItem", ["list", "milk"]],
  [{ type: "title", title: "Weekly" }, "updateList", ["list", { title: "Weekly" }]],
])(
  "list edit %j updates the server and expires only related cached views",
  async (edit, method, args) => {
    const queryClient = new QueryClient();
    const api = { [method]: vi.fn(async () => ({ title: "Weekly" })) };
    const related = [groceryQueryKeys.list("user", "list"), groceryQueryKeys.lists("user", null)];
    const unrelated = [
      groceryQueryKeys.lists("user", "household"),
      groceryQueryKeys.lists("other-user", null),
      groceryQueryKeys.list("user", "other-list"),
    ];
    for (const key of [...related, ...unrelated]) queryClient.setQueryData(key, []);
    const mutation = queryClient
      .getMutationCache()
      .build(
        queryClient,
        listMutationOptions({ api, queryClient, userId: "user", householdId: undefined }),
      );
    await mutation.execute({ ...edit, listId: "list" });
    expect(api[method]).toHaveBeenCalledExactlyOnceWith(...args);
    for (const key of related) expect(queryClient.getQueryState(key).isInvalidated).toBe(true);
    for (const key of unrelated) expect(queryClient.getQueryState(key).isInvalidated).toBe(false);
    queryClient.clear();
  },
);

test("failed edits preserve cached data and remain errors for retry", async () => {
  const queryClient = new QueryClient();
  const key = groceryQueryKeys.list("user", "list");
  const cached = { title: "Original" };
  queryClient.setQueryData(key, cached);
  const failure = new Error("Offline");
  const mutation = queryClient.getMutationCache().build(
    queryClient,
    listMutationOptions({
      api: {
        deleteItem: async () => {
          throw failure;
        },
      },
      queryClient,
      userId: "user",
      householdId: null,
    }),
  );
  await expect(mutation.execute({ type: "delete", listId: "list", itemId: "milk" })).rejects.toBe(
    failure,
  );
  expect(mutation.state.status).toBe("error");
  expect(queryClient.getQueryData(key)).toEqual(cached);
  expect(queryClient.getQueryState(key).isInvalidated).toBe(false);
  queryClient.clear();
});
