import { useUser } from "@clerk/expo";
import AccountCircle from "@expo/material-symbols/account_circle.xml";
import { Stack, useRouter } from "expo-router";
import {
  ArrowRight,
  BookMarked,
  CircleUserRound,
  History,
  ListChecks,
  MessageSquareText,
  ShoppingBasket,
  Users,
} from "lucide-react-native";
import { View } from "react-native";
import { HeaderActionButton } from "@/components/header-action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { NavigationRow } from "@/components/ui/navigation-row";
import { Screen } from "@/components/ui/screen";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useGroceryState } from "@/hooks/use-grocery-agent";

export default function GroceryHomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const state = useGroceryState();
  const itemCount = Math.max(state.shopping_list?.length ?? 0, state.cart?.length ?? 0);
  return (
    <>
      <Screen contentContainerClassName="gap-6">
        <View className="gap-1">
          <Text variant="muted">
            {user?.firstName ? `Hello, ${user.firstName}` : "Welcome to Grocery Agent"}
          </Text>
          <Text variant="h2">Good meals start here.</Text>
        </View>
        <Card className="gap-4 border-primary/20 bg-primary-surface p-5">
          <View className="flex-row items-center gap-3">
            <Icon as={MessageSquareText} className="size-6 text-primary" />
            <Text variant="h4" className="flex-1">
              What’s on the menu?
            </Text>
          </View>
          <Text>Turn a meal idea, a busy week, or a budget into a grocery list.</Text>
          <Button
            testID="home-plan"
            onPress={() => router.push("/chat")}
            iconAfter={<Icon as={ArrowRight} className="size-5 text-primary-foreground" />}
          >
            Plan in chat
          </Button>
        </Card>
        <View className="gap-3">
          <Text variant="h4">Your next shop</Text>
          <Card className="overflow-hidden p-0">
            <NavigationRow
              testID="home-grocery-plan"
              icon={ShoppingBasket}
              title={itemCount ? state.list_title || "Your grocery plan" : "Grocery plan"}
              description={
                itemCount
                  ? `${itemCount} items · ${state.status === "ready" ? "ready to review" : "planning in progress"}`
                  : "Review your list, product matches, and cart"
              }
              onPress={() => router.push("/list")}
            />
            <Separator className="ml-17" />
            <NavigationRow
              testID="home-households"
              icon={Users}
              title="Households"
              description="Keep everyone’s shopping in sync"
              onPress={() => router.push("/households")}
            />
          </Card>
        </View>
        <View className="gap-3">
          <Text variant="h4">Keep your favorites close</Text>
          <Card className="overflow-hidden p-0">
            <NavigationRow
              testID="home-saved-lists"
              icon={ListChecks}
              title="Saved lists"
              description="Shop a familiar list again"
              onPress={() => router.push("/saved-lists")}
            />
            <Separator className="ml-17" />
            <NavigationRow
              testID="home-recipes"
              icon={BookMarked}
              title="Saved recipes"
              description="Your ingredients and instructions"
              onPress={() => router.push("/saved-recipes")}
            />
            <Separator className="ml-17" />
            <NavigationRow
              testID="home-history"
              icon={History}
              title="Chat history"
              description="Pick up a previous conversation"
              onPress={() => router.push("/chat-history")}
            />
          </Card>
        </View>
      </Screen>
      {process.env.EXPO_OS === "web" ? (
        <Stack.Screen
          options={{
            headerRight: () => (
              <HeaderActionButton
                accessibilityLabel="Account"
                icon={CircleUserRound}
                onPress={() => router.push("/account")}
              />
            ),
          }}
        />
      ) : (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            accessibilityLabel="Account"
            icon={process.env.EXPO_OS === "android" ? AccountCircle : "person.crop.circle"}
            onPress={() => router.push("/account")}
          />
        </Stack.Toolbar>
      )}
    </>
  );
}
