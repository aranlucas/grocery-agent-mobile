import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Plus, Save, Trash2, BookOpen, Pencil } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert as NativeAlert, Pressable, View } from "react-native";
import { useFieldArray, useWatch } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput, FormTextarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { ErrorState } from "@/components/ui/error-state";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useSubmitForm } from "@/hooks/use-submit-form";
import { useHouseholdApi } from "@/hooks/use-household-api";
import { type Recipe, type RecipeContent } from "@/lib/household-api";
import { groceryQueryKeys } from "@/lib/query-keys";
import { firstParam } from "@/lib/utils";

type RecipeFormValues = Omit<RecipeContent, "tags"> & { tags: string };

const EMPTY_RECIPE_FORM: RecipeFormValues = {
  title: "",
  description: "",
  servings: "",
  notes: "",
  ingredients: [],
  steps: [],
  tags: "",
};

function recipeFormValues(recipe?: Recipe): RecipeFormValues {
  if (!recipe) return EMPTY_RECIPE_FORM;

  return {
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    notes: recipe.notes,
    ingredients: recipe.ingredients.map(({ name, note, quantity, unit }) => ({
      name,
      note,
      quantity,
      unit,
    })),
    steps: recipe.steps.map((step) => step.instruction),
    tags: recipe.tags.join(", "),
  };
}

export default function SavedRecipeScreen() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const recipeId = firstParam(useLocalSearchParams<{ recipeId?: string | string[] }>().recipeId);
  const { api, userId } = useHouseholdApi();
  const queryClient = useQueryClient();
  const recipeKey = groceryQueryKeys.recipe(userId, recipeId);
  const recipeQuery = useQuery({
    queryKey: recipeKey,
    queryFn: () => api.getRecipe(recipeId),
    enabled: Boolean(recipeId),
  });
  const values = useMemo(() => recipeFormValues(recipeQuery.data), [recipeQuery.data]);
  const {
    control,
    formState: { dirtyFields, isSubmitting, isDirty },
    handleSubmit,
    reset,
    setValue,
  } = useSubmitForm<RecipeFormValues>({ defaultValues: EMPTY_RECIPE_FORM });
  const allowNavigation = useUnsavedChanges(editing && isDirty, () => {
    reset(values);
    setEditing(false);
  });
  const keepDirtyValues = Object.keys(dirtyFields).length > 0;

  useEffect(() => {
    if (recipeQuery.data) {
      reset(values, { keepDirtyValues, keepDirty: keepDirtyValues });
    }
  }, [keepDirtyValues, recipeQuery.data, reset, values]);

  const ingredients = useFieldArray({ control, name: "ingredients" });
  const steps = useWatch({ control, name: "steps" }) ?? [];

  const updateRecipe = useMutation({
    mutationFn: (content: RecipeContent) => api.updateRecipe(recipeId, content),
    onSuccess: async (recipe) => {
      queryClient.setQueryData(recipeKey, recipe);
      reset(recipeFormValues(recipe));
      setEditing(false);
      allowNavigation();
      if (router.canGoBack()) router.back();
      else router.replace("/saved-recipes");
      await queryClient.invalidateQueries({
        queryKey: groceryQueryKeys.recipes(userId, recipe.household_id),
      });
    },
  });
  const submit = handleSubmit(async (draft) => {
    try {
      await updateRecipe.mutateAsync({
        ...draft,
        title: draft.title.trim(),
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
    } catch {
      // Mutation state displays the error; retain the input for retry.
    }
  });

  if (!recipeId) {
    return (
      <Screen contentContainerClassName="flex-grow justify-center">
        <ErrorState
          title="This recipe link is incomplete"
          message="Open the recipe again from your saved recipes."
          onRetry={() => router.replace("/saved-recipes")}
          retryLabel="Open saved recipes"
        />
      </Screen>
    );
  }

  if (recipeQuery.error instanceof Error && !recipeQuery.data) {
    return (
      <Screen contentContainerClassName="flex-grow justify-center">
        <ErrorState
          message={recipeQuery.error.message}
          onRetry={() => void recipeQuery.refetch()}
        />
      </Screen>
    );
  }

  if (recipeQuery.fetchStatus === "paused" && !recipeQuery.data)
    return (
      <Screen>
        <ErrorState
          title="You’re offline"
          message="Reconnect to load this recipe."
          onRetry={() => void recipeQuery.refetch()}
        />
      </Screen>
    );
  if (recipeQuery.isPending || !recipeQuery.data) {
    return (
      <Screen>
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </Screen>
    );
  }

  const recipe = recipeQuery.data;
  if (!editing)
    return (
      <Screen key="read">
        <Stack.Screen options={{ title: "Recipe" }} />
        <View className="gap-2">
          <Text variant="h2" selectable>
            {recipe.title}
          </Text>
          <Text variant="muted">
            {recipe.servings ? `${recipe.servings} servings · ` : ""}
            {recipe.household_id ? "Household recipe" : "Personal recipe"}
          </Text>
          {recipe.description ? <Text selectable>{recipe.description}</Text> : null}
          {recipe.tags.length ? (
            <Text className="text-primary" variant="small">
              {recipe.tags.join(" · ")}
            </Text>
          ) : null}
        </View>
        <View className="gap-3">
          <Text variant="h4">Ingredients</Text>
          <Card className="gap-3">
            {recipe.ingredients.length ? (
              recipe.ingredients.map((ingredient, index) => (
                <View key={index} className="flex-row gap-3">
                  <Text className="text-primary">•</Text>
                  <View className="flex-1">
                    <Text selectable>
                      {[ingredient.quantity, ingredient.unit, ingredient.name]
                        .filter(Boolean)
                        .join(" ")}
                    </Text>
                    {ingredient.note ? (
                      <Text variant="muted" selectable>
                        {ingredient.note}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
            ) : (
              <Text variant="muted">No ingredients saved yet. Add them in Edit recipe.</Text>
            )}
          </Card>
        </View>
        <View className="gap-4">
          <Text variant="h4">Method</Text>
          {recipe.steps.length ? (
            recipe.steps.map((step, index) => (
              <View className="flex-row items-start gap-3" key={index}>
                <View className="size-8 items-center justify-center rounded-full bg-primary-surface">
                  <Text variant="small" className="text-primary">
                    {index + 1}
                  </Text>
                </View>
                <Text className="flex-1" selectable>
                  {step.instruction}
                </Text>
              </View>
            ))
          ) : (
            <Text variant="muted">No instructions saved yet. Add them in Edit recipe.</Text>
          )}
        </View>
        {recipe.notes ? (
          <View className="gap-2">
            <Text variant="h4">Notes</Text>
            <Text selectable>{recipe.notes}</Text>
          </View>
        ) : null}
        <Button
          icon={<Icon as={Pencil} className="size-5 text-primary" />}
          variant="outline"
          onPress={() => {
            updateRecipe.reset();
            setEditing(true);
          }}
        >
          Edit recipe
        </Button>
        <Button
          icon={<Icon as={BookOpen} className="size-5 text-primary-foreground" />}
          onPress={() =>
            router.push({
              pathname: "/chat",
              params: {
                prompt: `Build a grocery list for my saved recipe “${recipe.title}”. Ingredients: ${recipe.ingredients.map((item) => [item.quantity, item.unit, item.name].filter(Boolean).join(" ")).join(", ")}.`,
              },
            })
          }
        >
          Plan groceries for this recipe
        </Button>
      </Screen>
    );

  return (
    <Screen key="edit">
      <Stack.Screen options={{ title: "Edit recipe" }} />
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text variant="muted">{isDirty ? "Unsaved changes" : "No changes yet"}</Text>
        <Button
          variant="ghost"
          disabled={isSubmitting}
          onPress={() => {
            if (!isDirty) {
              setEditing(false);
              return;
            }
            NativeAlert.alert("Discard changes?", "Your saved recipe will stay as it was.", [
              { text: "Keep editing", style: "cancel" },
              {
                text: "Discard",
                style: "destructive",
                onPress: () => {
                  reset(values);
                  setEditing(false);
                },
              },
            ]);
          }}
        >
          Cancel editing
        </Button>
      </View>
      <Text selectable variant="muted">
        Save when you’re finished. Your changes will be available wherever this recipe is shared.
      </Text>

      <Card className="p-0">
        <CardContent className="gap-3 p-4">
          <FormInput
            accessibilityLabel="Recipe title"
            control={control}
            label="Title"
            name="title"
            placeholder="Recipe title"
            rules={{
              validate: (value) => value.trim().length > 0 || "Add a recipe title.",
            }}
          />
          <FormTextarea
            accessibilityLabel="Recipe description"
            control={control}
            label="Description"
            name="description"
            placeholder="Short description"
          />
          <FormInput
            accessibilityLabel="Recipe servings"
            control={control}
            label="Servings"
            name="servings"
            placeholder="Servings"
          />
          <FormInput
            accessibilityLabel="Recipe tags"
            control={control}
            label="Tags"
            name="tags"
            placeholder="Tags, separated by commas"
          />
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader className="flex-row items-center justify-between p-4 pb-2">
          <CardTitle>Ingredients</CardTitle>
          <Button
            icon={<Icon as={Plus} className="size-4 text-secondary-foreground" />}
            onPress={() => ingredients.append({ name: "", note: "", quantity: "", unit: "" })}
            size="sm"
            variant="secondary"
          >
            Add
          </Button>
        </CardHeader>
        <CardContent className="gap-3 p-4 pt-2">
          {ingredients.fields.length === 0 ? (
            <Text variant="muted">Add an ingredient to start your recipe.</Text>
          ) : null}
          {ingredients.fields.map((ingredient, index) => (
            <View className="gap-3 border-t border-border pt-4" key={ingredient.id}>
              <View className="flex-row items-center gap-2">
                <FormInput
                  accessibilityLabel={`Ingredient ${index + 1}`}
                  containerClassName="flex-1"
                  control={control}
                  name={`ingredients.${index}.name`}
                  placeholder="Ingredient"
                  rules={{
                    validate: (value) => value.trim().length > 0 || "Add an ingredient.",
                  }}
                />
                <Pressable
                  accessibilityLabel={`Remove ingredient ${index + 1}`}
                  accessibilityRole="button"
                  className="min-h-14 min-w-14 items-center justify-center active:opacity-60"
                  onPress={() => ingredients.remove(index)}
                >
                  <Icon as={Trash2} className="size-5 text-muted-foreground" />
                </Pressable>
              </View>
              <View className="flex-row gap-3">
                <FormInput
                  accessibilityLabel={`Ingredient ${index + 1} quantity`}
                  containerClassName="min-w-0 flex-1"
                  control={control}
                  name={`ingredients.${index}.quantity`}
                  label="Quantity"
                  placeholder="2"
                />
                <FormInput
                  accessibilityLabel={`Ingredient ${index + 1} unit`}
                  containerClassName="min-w-0 flex-1"
                  control={control}
                  name={`ingredients.${index}.unit`}
                  label="Unit"
                  placeholder="cups"
                />
              </View>
              <FormInput
                accessibilityLabel={`Ingredient ${index + 1} note`}
                control={control}
                name={`ingredients.${index}.note`}
                placeholder="Note (optional)"
              />
            </View>
          ))}
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader className="flex-row items-center justify-between p-4 pb-2">
          <CardTitle>Steps</CardTitle>
          <Button
            icon={<Icon as={Plus} className="size-4 text-secondary-foreground" />}
            onPress={() => setValue("steps", [...steps, ""], { shouldDirty: true })}
            size="sm"
            variant="secondary"
          >
            Add
          </Button>
        </CardHeader>
        <CardContent className="gap-3 p-4 pt-2">
          {steps.length === 0 ? (
            <Text variant="muted">Add the first cooking instruction.</Text>
          ) : null}
          {steps.map((_, index) => (
            <View className="flex-row items-start gap-2" key={`step-${index}`}>
              <View className="mt-2 size-7 items-center justify-center rounded-full bg-muted">
                <Text className="font-bold" variant="small">
                  {String(index + 1)}
                </Text>
              </View>
              <FormTextarea
                accessibilityLabel={`Step ${index + 1}`}
                className="flex-1"
                containerClassName="flex-1"
                control={control}
                name={`steps.${index}`}
                placeholder="Instruction"
                rules={{
                  validate: (value) => value.trim().length > 0 || "Add an instruction.",
                }}
              />
              <Pressable
                accessibilityLabel={`Remove step ${index + 1}`}
                accessibilityRole="button"
                className="mt-2 min-h-14 min-w-14 items-center justify-center active:opacity-60"
                onPress={() =>
                  setValue(
                    "steps",
                    steps.filter((_, currentIndex) => currentIndex !== index),
                    { shouldDirty: true },
                  )
                }
              >
                <Icon as={Trash2} className="size-5 text-muted-foreground" />
              </Pressable>
            </View>
          ))}
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardContent className="p-4">
          <FormTextarea
            accessibilityLabel="Recipe notes"
            control={control}
            label="Notes"
            name="notes"
            placeholder="Notes"
          />
        </CardContent>
      </Card>

      {updateRecipe.error instanceof Error ? (
        <Alert title={updateRecipe.error.message} variant="destructive" />
      ) : null}

      <Button
        icon={<Icon as={Save} className="size-5 text-primary-foreground" />}
        disabled={!isDirty}
        loading={isSubmitting || updateRecipe.isPending}
        onPress={() => void submit()}
        size="lg"
      >
        Save changes
      </Button>
    </Screen>
  );
}
