import { useRouter } from "expo-router";
import { ListChecks } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CollectionToolbar,
  type CollectionScope,
  type CollectionSort,
} from "@/components/ui/collection-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { NavigationRow } from "@/components/ui/navigation-row";
import { RefreshControl } from "@/components/ui/refresh-control";
import { Screen } from "@/components/ui/screen";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useSavedResources } from "@/hooks/use-saved-resources";
import { filterCollection, updatedLabel } from "@/lib/collection";
import { groceryQueryKeys } from "@/lib/query-keys";

export default function SavedListsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<CollectionScope>("all");
  const [sort, setSort] = useState<CollectionSort>("recent");
  const {
    resources: lists,
    queryError,
    loading,
    refreshing,
    refresh,
  } = useSavedResources({
    queryKey: groceryQueryKeys.lists,
    load: (api, householdId) => api.listLists(householdId),
  });
  const filtered = filterCollection(lists, search, scope, sort);
  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
    >
      <Text variant="muted">Your personal and household lists, ready for the next shop.</Text>
      {lists.length > 0 ? (
        <CollectionToolbar
          search={search}
          onSearch={setSearch}
          scope={scope}
          onScope={setScope}
          sort={sort}
          onSort={setSort}
          placeholder="Search saved lists"
        />
      ) : null}
      {queryError instanceof Error ? (
        <ErrorState
          inline={lists.length > 0}
          title="Couldn’t load your lists"
          message={queryError.message}
          onRetry={() => void refresh()}
        />
      ) : null}
      {loading && !lists.length ? (
        <View
          accessibilityLabel="Loading saved lists"
          accessibilityRole="progressbar"
          className="gap-3"
        >
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </View>
      ) : filtered.length ? (
        <>
          <Text variant="muted" accessibilityLiveRegion="polite">
            {filtered.length} {filtered.length === 1 ? "list" : "lists"}
          </Text>
          <Card className="overflow-hidden p-0">
            {filtered.map(({ resource: list, location }, index) => (
              <View key={list.id}>
                {index > 0 ? <Separator className="ml-17" /> : null}
                <NavigationRow
                  icon={ListChecks}
                  title={list.title}
                  description={`${location} · ${updatedLabel(list.updated_at)}`}
                  onPress={() =>
                    router.push({ pathname: "/saved-list", params: { listId: list.id } })
                  }
                />
              </View>
            ))}
          </Card>
        </>
      ) : lists.length ? (
        <EmptyState
          title="No matching lists"
          description="Try a different name or show all your lists."
          action={{
            label: "Clear filters",
            onPress: () => {
              setSearch("");
              setScope("all");
            },
          }}
        />
      ) : !queryError ? (
        <EmptyState
          icon={<Icon as={ListChecks} className="size-7 text-primary" />}
          title="Keep a list for next time"
          description="Plan in chat, then save your grocery list. You can edit it and check items off as you shop."
          action={{ label: "Plan a grocery list", onPress: () => router.push("/chat") }}
        />
      ) : null}
      {lists.length ? (
        <Button onPress={() => router.push("/chat")} variant="outline">
          Plan another list
        </Button>
      ) : null}
    </Screen>
  );
}
