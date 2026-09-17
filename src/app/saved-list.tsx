import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Plus, Save } from "lucide-react-native";
import { useEffect } from "react";
import { View } from "react-native";
import { GroceryListItemRow } from "@/components/grocery-list-item-row";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useSubmitForm } from "@/hooks/use-submit-form";
import { useHouseholdApi } from "@/hooks/use-household-api";
import { groceryQueryKeys } from "@/lib/query-keys";
import { firstParam } from "@/lib/utils";

type TitleForm = { title: string };
type AddItemForm = { name: string };

export default function SavedListScreen() {
  const listId = firstParam(useLocalSearchParams<{ listId?: string | string[] }>().listId);
  const { api, userId } = useHouseholdApi();
  const queryClient = useQueryClient();
  const listKey = groceryQueryKeys.list(userId, listId);
  const listQuery = useQuery({
    queryKey: listKey,
    queryFn: () => api.getList(listId),
    enabled: Boolean(listId),
  });
  const {
    control,
    formState: { dirtyFields, isSubmitting },
    handleSubmit,
    reset,
    resetField,
  } = useSubmitForm<TitleForm>({ defaultValues: { title: "" } });
  const addItemForm = useSubmitForm<AddItemForm>({ defaultValues: { name: "" } });
  const list = listQuery.data;
  const keepDirtyValues = Object.keys(dirtyFields).length > 0;

  useEffect(() => {
    if (list) {
      reset({ title: list.title }, { keepDirtyValues });
    }
  }, [keepDirtyValues, list, reset]);
  const mutateList = useMutation({
    mutationFn: async (
      mutation:
        | { type: "title"; title: string }
        | { type: "add"; name: string }
        | { type: "toggle"; itemId: string; checked: boolean }
        | { type: "delete"; itemId: string },
    ) => {
      switch (mutation.type) {
        case "title":
          return api.updateList(listId, { title: mutation.title });
        case "add":
          await api.addItems(listId, [{ name: mutation.name }]);
          return undefined;
        case "toggle":
          await api.updateItem(listId, mutation.itemId, {
            checked: mutation.checked,
          });
          return undefined;
        case "delete":
          await api.deleteItem(listId, mutation.itemId);
          return undefined;
      }
    },
    onSuccess: async (updatedList, mutation) => {
      if (mutation.type === "title" && updatedList) {
        queryClient.setQueryData(listKey, updatedList);
        resetField("title", { defaultValue: updatedList.title });
      }
      if (mutation.type === "add") addItemForm.reset();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listKey }),
        queryClient.invalidateQueries({
          queryKey: groceryQueryKeys.lists(userId, list?.household_id),
        }),
      ]);
    },
  });
  const saveTitle = handleSubmit(async ({ title }) => {
    try {
      await mutateList.mutateAsync({ type: "title", title: title.trim() });
    } catch {
      // Mutation state displays the error; retain the input for retry.
    }
  });
  const submitAddItem = addItemForm.handleSubmit(async ({ name }) => {
    try {
      await mutateList.mutateAsync({ type: "add", name: name.trim() });
    } catch {
      // Mutation state displays the error; retain the input for retry.
    }
  });

  if (!listId) {
    return (
      <Screen contentContainerClassName="flex-grow justify-center">
        <Alert
          title="This saved list link is incomplete. Go back and open it again."
          variant="destructive"
        />
      </Screen>
    );
  }
  if (listQuery.isPending) {
    return (
      <Screen>
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </Screen>
    );
  }
  if (listQuery.error instanceof Error || !list) {
    return (
      <Screen contentContainerClassName="flex-grow justify-center">
        <Alert
          title={listQuery.error instanceof Error ? listQuery.error.message : "List not found"}
          variant="destructive"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center gap-2">
        <FormInput
          accessibilityLabel="Grocery list title"
          containerClassName="flex-1"
          control={control}
          label="List title"
          onSubmitEditing={() => void saveTitle()}
          returnKeyType="done"
          name="title"
          rules={{
            validate: (value) => value.trim().length > 0 || "Add a title.",
          }}
        />
        <Button
          accessibilityLabel="Save list title"
          loading={isSubmitting}
          disabled={mutateList.isPending}
          icon={<Icon as={Save} className="size-4.5 text-primary-foreground" />}
          onPress={() => void saveTitle()}
          size="icon"
        />
      </View>

      <Card className="overflow-hidden p-0">
        <CardHeader className="p-4">
          <CardTitle>
            {list.items.length} {list.items.length === 1 ? "item" : "items"}
          </CardTitle>
          <CardDescription>Changes sync with Grocery Agent and authorized members.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {list.items.length ? (
            list.items.map((item, index) => (
              <GroceryListItemRow
                key={item.id}
                item={item}
                onDelete={() => mutateList.mutate({ type: "delete", itemId: item.id })}
                onToggle={(checked) =>
                  mutateList.mutate({
                    type: "toggle",
                    itemId: item.id,
                    checked,
                  })
                }
                showSeparator={index < list.items.length - 1}
              />
            ))
          ) : (
            <Text className="p-4" variant="muted">
              No items yet. Add the first item below.
            </Text>
          )}
        </CardContent>
      </Card>

      <View className="flex-row items-center gap-2">
        <FormInput
          accessibilityLabel="New grocery item"
          className="flex-1"
          containerClassName="flex-1"
          control={addItemForm.control}
          name="name"
          onSubmitEditing={() => void submitAddItem()}
          placeholder="Add an item"
          returnKeyType="done"
          rules={{
            validate: (value) => value.trim().length > 0 || "Add an item.",
          }}
        />
        <Button
          accessibilityLabel="Add grocery item"
          loading={addItemForm.formState.isSubmitting}
          disabled={mutateList.isPending}
          icon={<Icon as={Plus} className="size-5 text-primary-foreground" />}
          onPress={() => void submitAddItem()}
          size="icon"
        />
      </View>

      {mutateList.error instanceof Error ? (
        <Alert title={mutateList.error.message} variant="destructive" />
      ) : null}
    </Screen>
  );
}
