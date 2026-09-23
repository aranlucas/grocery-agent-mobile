import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import { memo, useMemo, useState } from "react";
import { View } from "react-native";
import { Save, ShoppingCart, ShoppingBasket } from "lucide-react-native";
import { ADD_TO_CART_MESSAGE, AddToCartDialog } from "@/components/add-to-cart-dialog";
import { KrogerProductImage } from "@/components/kroger-product-image";
import { KrogerConnectionCard } from "@/components/kroger-connection-card";
import { SaveResourceDialog } from "@/components/save-resource-dialog";
import { useGroceryAgent } from "@/components/grocery-agent-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Disclosure } from "@/components/ui/disclosure";
import { MarkdownText } from "@/components/ui/markdown-text";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Price } from "@/components/ui/price";
import { Screen } from "@/components/ui/screen";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useGroceryState } from "@/hooks/use-grocery-agent";
import { useHouseholdApi } from "@/hooks/use-household-api";
import { useKrogerConnection } from "@/hooks/use-kroger-connection";
import { cartSubtotal, pantryNames } from "@/lib/grocery-state";
import { groceryQueryKeys } from "@/lib/query-keys";

type GroceryRow = {
  detail: string;
  imageUrl?: string;
  name: string;
};

const GroceryItemRow = memo(function GroceryItemRow({
  isLast,
  item,
}: {
  isLast: boolean;
  item: GroceryRow;
}) {
  return (
    <View>
      <View className="min-h-17 flex-row items-center gap-3 px-4 py-3">
        <KrogerProductImage imageUrl={item.imageUrl} name={item.name} />
        <View className="flex-1 gap-0.5">
          <Text variant="large">{item.name}</Text>
          <Text variant="muted">{item.detail}</Text>
        </View>
      </View>
      {!isLast ? <Separator className="ml-19" /> : null}
    </View>
  );
});

function GroceryListContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ save?: string | string[] }>();
  const requestSave = Array.isArray(params.save) ? params.save[0] : params.save;
  const { api, userId } = useHouseholdApi();
  const queryClient = useQueryClient();
  const { isRunning, error, send } = useGroceryAgent();
  const state = useGroceryState();
  const connection = useKrogerConnection();
  const { connected } = connection;
  const [mealOpen, setMealOpen] = useState(false);
  const [dealsOpen, setDealsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(requestSave === "1");
  const list = useMemo(() => state.shopping_list ?? [], [state.shopping_list]);
  const cart = useMemo(() => state.cart ?? [], [state.cart]);
  const { matchesByName, matchesByQuery, matchesByUPC } = useMemo(() => {
    const matches = state.product_matches ?? [];
    const byName = new Map<string, (typeof matches)[number]>();
    const byQuery = new Map<string, (typeof matches)[number]>();
    const byUPC = new Map<string, (typeof matches)[number]>();
    for (const match of matches) {
      if (!byName.has(match.name)) byName.set(match.name, match);
      byQuery.set(match.query.trim().toLocaleLowerCase(), match);
      byUPC.set(match.upc, match);
    }
    return {
      matchesByName: byName,
      matchesByQuery: byQuery,
      matchesByUPC: byUPC,
    };
  }, [state.product_matches]);
  const pantry = useMemo(
    () => pantryNames(state.shopping_profile?.pantry ?? []),
    [state.shopping_profile?.pantry],
  );
  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);
  const rows = useMemo(
    () =>
      cart.length
        ? cart.map((item) => {
            const match =
              (item.upc ? matchesByUPC.get(item.upc) : undefined) ?? matchesByName.get(item.name);
            return {
              name: item.name,
              imageUrl: match?.image_url,
              detail: `${item.quantity} · ${item.price !== undefined ? `$${item.price.toFixed(2)}` : "Price at checkout"}`,
            };
          })
        : list.map((name) => {
            const normalizedName = name.trim().toLocaleLowerCase();
            const match = matchesByQuery.get(normalizedName);
            const matchDetails = [
              match?.size,
              match?.price !== undefined ? `$${match.price.toFixed(2)}` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return {
              name: match?.name ?? name,
              imageUrl: match?.image_url,
              detail: pantry.has(normalizedName)
                ? "Already in pantry"
                : match
                  ? matchDetails || "Kroger match"
                  : connected
                    ? "No live match selected"
                    : "Suggested item",
            };
          }),
    [cart, connected, list, matchesByName, matchesByQuery, matchesByUPC, pantry],
  );
  const householdsQuery = useQuery({
    queryKey: groceryQueryKeys.households(userId),
    queryFn: api.listHouseholds,
    enabled: saveOpen && Boolean(userId),
  });
  const saveList = useMutation({
    mutationFn: ({ title, householdId }: { title: string; householdId?: string }) =>
      api.createList(
        title,
        householdId,
        list.map((name) => ({
          name,
          quantity: matchesByQuery.get(name.trim().toLocaleLowerCase())?.size || "1",
        })),
      ),
    onSuccess: async (saved) => {
      setSaveOpen(false);
      if (requestSave === "1") {
        if (router.canGoBack()) router.back();
        else router.replace("/chat");
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: groceryQueryKeys.lists(userId, null),
        }),
        saved.household_id
          ? queryClient.invalidateQueries({
              queryKey: groceryQueryKeys.lists(userId, saved.household_id),
            })
          : Promise.resolve(),
      ]);
    },
  });

  if (!list.length && !cart.length && !state.meal_plan) {
    return (
      <Screen contentContainerClassName="grow justify-center">
        <EmptyState
          action={{
            label: "Start planning",
            onPress: () => router.replace("/chat"),
          }}
          className="w-full max-w-3xl flex-1 self-center bg-background"
          description="Ask Grocery Agent for a recipe, meal plan, or budget-friendly list."
          icon={<Icon as={ShoppingBasket} className="size-9 text-primary" />}
          title="Your first plan starts in chat"
        />
      </Screen>
    );
  }

  return (
    <>
      <Screen>
        <View className="flex-row flex-wrap items-end justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text variant="h3">{state.list_title || "Your grocery list"}</Text>
            <Text className="mt-1" variant="muted">
              {rows.length} items · {state.product_matches?.length ?? 0} matched to Kroger
            </Text>
          </View>
          {subtotal > 0 ? (
            <View className="gap-1">
              <Text variant="muted">Estimated subtotal</Text>
              <Price amount={subtotal} textClassName="text-xl font-semibold text-foreground" />
            </View>
          ) : null}
        </View>

        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            {rows.map((item, index) => (
              <GroceryItemRow
                isLast={index === rows.length - 1}
                item={item}
                key={`${item.name}-${index}`}
              />
            ))}
          </CardContent>
        </Card>

        {state.meal_plan ? (
          <Disclosure label="Meal plan" open={mealOpen} onOpenChange={setMealOpen}>
            <MarkdownText content={state.meal_plan} />
          </Disclosure>
        ) : null}
        {state.weekly_deals ? (
          <Disclosure label="Weekly deals" open={dealsOpen} onOpenChange={setDealsOpen}>
            <MarkdownText content={state.weekly_deals} />
          </Disclosure>
        ) : null}
        {state.status !== "ready" ? (
          <Text variant="muted">
            {isRunning
              ? "Your plan is still updating. You can save and add matched items when it’s ready."
              : "Continue in chat to finish your grocery plan."}
          </Text>
        ) : null}
        {error ? <Alert title={error} variant="destructive" /> : null}
        {saveList.data ? <Alert title={`${saveList.data.title} saved`} variant="success" /> : null}
        <Button
          icon={<Icon as={Save} className="size-5 text-secondary-foreground" />}
          disabled={!list.length || isRunning || state.status !== "ready"}
          size="lg"
          variant="secondary"
          onPress={() => setSaveOpen(true)}
        >
          Save list
        </Button>
        {connected ? (
          <Button
            icon={<Icon as={ShoppingCart} className="size-5 text-primary-foreground" />}
            loading={isRunning}
            disabled={!state.product_matches?.length || state.status !== "ready"}
            size="lg"
            onPress={() => setConfirmOpen(true)}
          >
            Add to Kroger cart
          </Button>
        ) : (
          <KrogerConnectionCard connection={connection} />
        )}
        <Button variant="ghost" onPress={() => router.push("/chat")}>
          Refine in chat
        </Button>
      </Screen>
      <AddToCartDialog
        itemCount={state.product_matches?.length ?? 0}
        subtotal={subtotal}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void send(ADD_TO_CART_MESSAGE)}
      />
      <SaveResourceDialog
        defaultTitle={state.list_title?.trim() || "Grocery list"}
        error={
          saveList.error instanceof Error
            ? saveList.error.message
            : householdsQuery.error instanceof Error
              ? householdsQuery.error.message
              : undefined
        }
        households={householdsQuery.data ?? []}
        kind="list"
        onConfirm={(title, householdId) => saveList.mutateAsync({ title, householdId })}
        onOpenChange={setSaveOpen}
        open={saveOpen}
      />
    </>
  );
}

export default function GroceryListScreen() {
  return <GroceryListContent />;
}
