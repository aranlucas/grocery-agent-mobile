import { useQueries, useQuery } from "@tanstack/react-query";
import { useHouseholdApi } from "@/hooks/use-household-api";
import type { Household, HouseholdApi } from "@/lib/household-api";
import { groceryQueryKeys } from "@/lib/query-keys";

export type SavedResource<T> = {
  resource: T;
  location: string;
};

type ResourceQueryKey = (
  userId: string | null | undefined,
  householdId: string | null | undefined,
) => readonly unknown[];

type ResourceLoader<T> = (api: HouseholdApi, householdId?: string) => Promise<T[]>;

export function useSavedResources<T>({
  queryKey,
  load,
}: {
  queryKey: ResourceQueryKey;
  load: ResourceLoader<T>;
}): {
  api: HouseholdApi;
  households: Household[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  queryError: unknown;
  resources: SavedResource<T>[];
  userId: string | null | undefined;
} {
  const { api, userId } = useHouseholdApi();
  const householdsQuery = useQuery({
    queryKey: groceryQueryKeys.households(userId),
    queryFn: api.listHouseholds,
    enabled: Boolean(userId),
  });
  const personalQuery = useQuery({
    queryKey: queryKey(userId, null),
    queryFn: () => load(api),
    enabled: Boolean(userId),
  });
  const householdQueries = useQueries({
    queries: (householdsQuery.data ?? []).map((household) => ({
      queryKey: queryKey(userId, household.id),
      queryFn: () => load(api, household.id),
      enabled: Boolean(userId),
    })),
  });
  const resources = [
    ...(personalQuery.data ?? []).map((resource) => ({
      resource,
      location: "Personal",
    })),
    ...householdQueries.flatMap((query, index) =>
      ((query.data as T[] | undefined) ?? []).map((resource) => ({
        resource,
        location: householdsQuery.data?.[index]?.name ?? "Household",
      })),
    ),
  ];
  const paused = [personalQuery, householdsQuery, ...householdQueries].some(
    (query) => query.fetchStatus === "paused",
  );
  const queryError =
    personalQuery.error ??
    householdsQuery.error ??
    householdQueries.find((query) => query.error)?.error ??
    (paused
      ? new Error("You’re offline. Your saved items will refresh when you reconnect.")
      : null);
  const loading =
    personalQuery.isPending ||
    householdsQuery.isPending ||
    householdQueries.some((query) => query.isPending);

  return {
    api,
    households: householdsQuery.data ?? [],
    loading: loading && !paused,
    refreshing:
      personalQuery.isRefetching ||
      householdsQuery.isRefetching ||
      householdQueries.some((query) => query.isRefetching),
    refresh: async () => {
      await Promise.all([
        personalQuery.refetch(),
        householdsQuery.refetch(),
        ...householdQueries.map((query) => query.refetch()),
      ]);
    },
    queryError,
    resources,
    userId,
  };
}
