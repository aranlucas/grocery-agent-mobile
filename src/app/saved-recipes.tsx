import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookMarked, Plus, Save } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { useGroceryAgent } from "@/components/grocery-agent-provider";
import { SaveResourceDialog } from "@/components/save-resource-dialog";
import { Alert } from "@/components/ui/alert";
import {
  CollectionToolbar,
  type CollectionScope,
  type CollectionSort,
} from "@/components/ui/collection-toolbar";
import { ErrorState } from "@/components/ui/error-state";
import { NavigationRow } from "@/components/ui/navigation-row";
import { RefreshControl } from "@/components/ui/refresh-control";
import { Separator } from "@/components/ui/separator";
import { filterCollection } from "@/lib/collection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useGroceryState } from "@/hooks/use-grocery-agent";
import { useSavedResources } from "@/hooks/use-saved-resources";

import { groceryQueryKeys } from "@/lib/query-keys";

export default function SavedRecipesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<CollectionScope>("all");
  const [sort, setSort] = useState<CollectionSort>("recent");
  const params = useLocalSearchParams<{ save?: string | string[] }>();
  const requestSave = Array.isArray(params.save) ? params.save[0] : params.save;
  const { isRunning } = useGroceryAgent();
  const state = useGroceryState();
  const draft = state.recipe;
  const {
    api,
    households,
    queryError,
    loading,
    refreshing,
    refresh,
    resources: recipes,
    userId,
  } = useSavedResources({
    queryKey: groceryQueryKeys.recipes,
    load: (api, householdId) => api.listRecipes(householdId),
  });
  const filtered = filterCollection(
    recipes,
    search,
    scope,
    sort,
    (recipe) => `${recipe.description} ${recipe.tags.join(" ")}`,
  );
  const queryClient = useQueryClient();
  const [saveOpen, setSaveOpen] = useState(requestSave === "1" && Boolean(draft));
  const saveRecipe = useMutation({
    mutationFn: ({ title, householdId }: { title: string; householdId?: string }) => {
      if (!draft) throw new Error("There is no recipe draft to save.");
      return api.createRecipe(
        {
          title,
          description: draft.description,
          servings: draft.servings,
          notes: draft.notes,
          ingredients: draft.ingredients,
          steps: draft.steps,
          tags: draft.tags,
        },
        householdId,
      );
    },
    onSuccess: async (saved) => {
      setSaveOpen(false);
      if (requestSave === "1") {
        if (router.canGoBack()) router.back();
        else router.replace("/chat");
      }
      await queryClient.invalidateQueries({
        queryKey: groceryQueryKeys.recipes(userId, saved.household_id),
      });
    },
  });

  return (
    <>
      <Screen
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
      >
        <Text variant="muted">A little inspiration, saved for another day.</Text>
        {recipes.length ? (
          <CollectionToolbar
            search={search}
            onSearch={setSearch}
            scope={scope}
            onScope={setScope}
            sort={sort}
            onSort={setSort}
            placeholder="Search recipes or tags"
          />
        ) : null}

        {draft ? (
          <Card>
            <CardHeader className="flex-row items-center gap-3 pb-2">
              <View className="size-11 items-center justify-center rounded-md bg-muted">
                <Icon as={BookMarked} className="size-5 text-primary" />
              </View>
              <View className="flex-1 gap-0.5">
                <CardTitle>{draft.title}</CardTitle>
                <CardDescription>Current unsaved recipe from chat</CardDescription>
              </View>
            </CardHeader>
            <CardContent className="pt-2">
              <Button
                disabled={isRunning}
                icon={<Icon as={Save} className="size-4.5 text-primary-foreground" />}
                onPress={() => setSaveOpen(true)}
                size="lg"
              >
                Save this recipe
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {queryError instanceof Error ? (
          <ErrorState
            inline={recipes.length > 0}
            title="Couldn’t load your recipes"
            message={queryError.message}
            onRetry={() => void refresh()}
          />
        ) : null}
        {saveRecipe.data ? (
          <Alert title={`${saveRecipe.data.title} saved`} variant="success" />
        ) : null}

        {loading && !recipes.length ? (
          <View accessibilityLabel="Loading saved recipes" className="gap-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </View>
        ) : filtered.length ? (
          <Card className="overflow-hidden p-0">
            {filtered.map(({ resource: recipe, location }, index) => (
              <View key={recipe.id}>
                {index > 0 ? <Separator className="ml-17" /> : null}
                <NavigationRow
                  icon={BookMarked}
                  title={recipe.title}
                  description={`${location}${recipe.servings ? ` · ${recipe.servings} servings` : ""}${recipe.description ? ` · ${recipe.description}` : ""}`}
                  onPress={() =>
                    router.push({ pathname: "/saved-recipe", params: { recipeId: recipe.id } })
                  }
                />
              </View>
            ))}
          </Card>
        ) : recipes.length ? (
          <EmptyState
            title="No matching recipes"
            description="Try a different name or show all your recipes."
            action={{
              label: "Clear filters",
              onPress: () => {
                setSearch("");
                setScope("all");
              },
            }}
          />
        ) : queryError instanceof Error ? null : (
          <EmptyState
            action={{
              label: "Plan a recipe",
              onPress: () => router.replace("/chat"),
            }}
            className="min-h-72"
            description="Recipes you save will stay here so you can quickly build the grocery list again."
            icon={<Icon as={BookMarked} className="size-8 text-primary" strokeWidth={2} />}
            title="No saved recipes yet"
          />
        )}

        {recipes.length > 0 ? (
          <Button
            icon={<Icon as={Plus} className="size-4.5 text-secondary-foreground" />}
            onPress={() => router.push("/chat")}
            size="lg"
            variant="secondary"
          >
            Plan another recipe
          </Button>
        ) : null}
      </Screen>
      <SaveResourceDialog
        defaultTitle={draft?.title ?? "Recipe"}
        error={saveRecipe.error instanceof Error ? saveRecipe.error.message : undefined}
        households={households}
        kind="recipe"
        onConfirm={(title, householdId) => saveRecipe.mutateAsync({ title, householdId })}
        onOpenChange={setSaveOpen}
        open={saveOpen}
      />
    </>
  );
}
