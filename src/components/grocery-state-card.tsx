import type { GroceryState } from "@agents/types";
import { Pressable, View } from "react-native";
import { ArrowRight, BookMarked, Save, ShoppingBasket, ShoppingCart } from "lucide-react-native";
import { KrogerProductImage } from "@/components/kroger-product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { MarkdownText } from "@/components/ui/markdown-text";
import { Price } from "@/components/ui/price";
import { Text } from "@/components/ui/text";
import { cartSubtotal, pantryNames } from "@/lib/grocery-state";
import { Disclosure } from "@/components/ui/disclosure";
import { useState } from "react";

export function GroceryStateCard({
  state,
  onOpenList,
  onAddToCart,
  onSaveList,
  onSaveRecipe,
  adding = false,
  connected,
}: {
  state: GroceryState;
  onOpenList?: () => void;
  onAddToCart?: () => void;
  onSaveList?: () => void;
  onSaveRecipe?: () => void;
  adding?: boolean;
  connected: boolean;
}) {
  const [mealOpen, setMealOpen] = useState(false);
  const list = state.shopping_list ?? [];
  const cart = state.cart ?? [];
  const matches = state.product_matches ?? [];
  const pantry = pantryNames(state.shopping_profile?.pantry ?? []);
  const skipped = list.filter((item) => pantry.has(item.trim().toLocaleLowerCase()));
  const preview: Array<{ name: string; imageUrl?: string }> = matches.length
    ? matches.slice(0, 4).map((item) => ({ name: item.name, imageUrl: item.image_url }))
    : cart.length > 0
      ? cart.slice(0, 4).map((item) => ({ name: item.name }))
      : list.slice(0, 4).map((name) => ({ name }));
  const subtotal = cartSubtotal(cart);
  if (!list.length && !state.meal_plan && !state.recipe && !cart.length) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2.5 pb-0">
        <View className="size-11 items-center justify-center rounded-full bg-muted">
          <Icon as={ShoppingBasket} className="size-5.5 text-primary" />
        </View>
        <View className="flex-1 gap-0.5">
          <CardTitle>{connected ? "Kroger grocery plan" : "Your grocery plan"}</CardTitle>
          <CardDescription>
            {adding
              ? "Updating your plan…"
              : state.status === "ready"
                ? "Ready to review"
                : "Plan in progress"}
          </CardDescription>
        </View>
        {state.status === "ready" ? <Badge variant="outline">Ready</Badge> : null}
      </CardHeader>

      <CardContent className="gap-3.5">
        {state.meal_plan ? (
          <Disclosure label="Meal plan" open={mealOpen} onOpenChange={setMealOpen}>
            <View className="min-w-0">
              <MarkdownText content={state.meal_plan} />
            </View>
          </Disclosure>
        ) : null}

        {state.recipe ? (
          <View className="gap-2 rounded-2xl bg-muted p-3">
            <View className="flex-row items-center gap-2">
              <Icon as={BookMarked} className="size-4.5 text-primary" />
              <Text className="flex-1" variant="large">
                {state.recipe.title}
              </Text>
            </View>
            {state.recipe.description ? (
              <Text numberOfLines={3} variant="muted">
                {state.recipe.description}
              </Text>
            ) : null}
            <Text variant="muted">
              {state.recipe.ingredients.length} ingredients · {state.recipe.steps.length} steps
            </Text>
            {onSaveRecipe ? (
              <Button
                disabled={adding}
                icon={<Icon as={Save} className="size-4.5 text-secondary-foreground" />}
                onPress={onSaveRecipe}
                size="sm"
                variant="secondary"
              >
                Save recipe
              </Button>
            ) : null}
          </View>
        ) : null}

        {preview.length ? (
          <View className="gap-2">
            {preview.slice(0, 3).map((item, index) => (
              <View className="flex-row items-center gap-3" key={`${item.name}-${index}`}>
                <KrogerProductImage imageUrl={item.imageUrl} name={item.name} size="compact" />
                <Text className="flex-1" numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {list.length || cart.length ? (
          <Pressable
            accessibilityRole={onOpenList ? "button" : undefined}
            className="min-h-14 flex-row items-center justify-between gap-3 rounded-2xl bg-primary-surface px-4 py-3 active:opacity-70"
            disabled={!onOpenList}
            onPress={onOpenList}
          >
            <View className="flex-1">
              <Text variant="large">Review {Math.max(list.length, cart.length)} items</Text>
              {subtotal > 0 ? (
                <Price
                  amount={subtotal}
                  prefix="Estimated subtotal"
                  textClassName="text-sm text-muted-foreground"
                />
              ) : (
                <Text className="mt-0.5" variant="muted">
                  Check quantities and matches
                </Text>
              )}
              {skipped.length ? <Text variant="muted">{skipped.length} in pantry</Text> : null}
            </View>
            <Icon as={ArrowRight} className="size-5 text-secondary" />
          </Pressable>
        ) : null}
      </CardContent>

      {list.length > 0 && (onSaveList || (connected && onAddToCart)) ? (
        <CardFooter className="flex-col items-stretch gap-2 pt-0 sm:flex-row">
          {onSaveList ? (
            <Button
              className="w-full sm:w-auto sm:flex-1"
              disabled={adding || state.status !== "ready"}
              icon={<Icon as={Save} className="size-4.5 text-secondary-foreground" />}
              onPress={onSaveList}
              size="lg"
              variant="secondary"
            >
              Save list
            </Button>
          ) : null}
          {connected && onAddToCart ? (
            <Button
              className="w-full sm:w-auto sm:flex-1"
              icon={<Icon as={ShoppingCart} className="size-4.5 text-primary-foreground" />}
              loading={adding}
              disabled={!matches.length || state.status !== "ready"}
              onPress={onAddToCart}
              size="lg"
            >
              Add to Kroger cart
            </Button>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
