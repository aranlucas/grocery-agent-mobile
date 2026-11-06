import { type QueryClient } from "@tanstack/react-query";
import type { HouseholdApi } from "@/lib/household-api";
import { groceryQueryKeys } from "@/lib/query-keys";

export type ListMutation =
  | { type: "title"; title: string }
  | { type: "add"; name: string }
  | { type: "toggle"; itemId: string; checked: boolean }
  | { type: "delete"; itemId: string };

export function listMutationOptions({
  api,
  queryClient,
  userId,
  householdId,
}: {
  api: HouseholdApi;
  queryClient: QueryClient;
  userId: string | null | undefined;
  householdId: string | null | undefined;
}) {
  return {
    mutationFn: async (mutation: ListMutation & { listId: string }) => {
      const { listId } = mutation;
      switch (mutation.type) {
        case "title":
          return api.updateList(listId, { title: mutation.title });
        case "add":
          await api.addItems(listId, [{ name: mutation.name }]);
          return undefined;
        case "toggle":
          await api.updateItem(listId, mutation.itemId, { checked: mutation.checked });
          return undefined;
        case "delete":
          await api.deleteItem(listId, mutation.itemId);
          return undefined;
      }
    },
    onSuccess: async (_: unknown, mutation: ListMutation & { listId: string }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groceryQueryKeys.list(userId, mutation.listId) }),
        queryClient.invalidateQueries({ queryKey: groceryQueryKeys.lists(userId, householdId) }),
      ]);
    },
  };
}
