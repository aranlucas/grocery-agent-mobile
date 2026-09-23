import EditSquare from "@expo/material-symbols/edit_square.xml";
import History from "@expo/material-symbols/history.xml";
import { Stack, useRouter } from "expo-router";
import { History as HistoryIcon, SquarePen } from "lucide-react-native";
import { View } from "react-native";
import { GroceryChat } from "@/components/grocery-chat";
import { useGroceryAgent } from "@/components/grocery-agent-provider";
import { HeaderActionButton } from "@/components/header-action-button";

export default function GroceryChatScreen() {
  const router = useRouter();
  const { startNewChat } = useGroceryAgent();

  return (
    <>
      <GroceryChat />
      {process.env.EXPO_OS === "web" ? (
        <Stack.Screen
          options={{
            headerRight: () => (
              <View className="flex-row items-center gap-1">
                <HeaderActionButton
                  accessibilityLabel="Previous chats"
                  icon={HistoryIcon}
                  onPress={() => router.push("/chat-history")}
                />
                <HeaderActionButton
                  accessibilityLabel="New chat"
                  icon={SquarePen}
                  onPress={() => void startNewChat()}
                />
              </View>
            ),
          }}
        />
      ) : (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            accessibilityLabel="Previous chats"
            icon={process.env.EXPO_OS === "android" ? History : "clock.arrow.circlepath"}
            onPress={() => router.push("/chat-history")}
          />
          <Stack.Toolbar.Button
            accessibilityLabel="New chat"
            icon={process.env.EXPO_OS === "android" ? EditSquare : "square.and.pencil"}
            onPress={() => void startNewChat()}
          />
        </Stack.Toolbar>
      )}
    </>
  );
}
