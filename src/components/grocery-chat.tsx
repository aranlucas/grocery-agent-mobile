import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Sparkles } from "lucide-react-native";
import { ADD_TO_CART_MESSAGE, AddToCartDialog } from "@/components/add-to-cart-dialog";
import { GroceryStateCard } from "@/components/grocery-state-card";
import { useGroceryAgent } from "@/components/grocery-agent-provider";
import { KrogerConnectionCard } from "@/components/kroger-connection-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Disclosure } from "@/components/ui/disclosure";
import { FormField } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { KeyboardView } from "@/components/ui/keyboard-view";
import { MarkdownText } from "@/components/ui/markdown-text";
import { PromptInput, PromptInputSend, PromptInputTextarea } from "@/components/ui/prompt-input";
import { SafeArea } from "@/components/ui/safe-area";
import { Text } from "@/components/ui/text";
import {
  useGroceryMessages,
  useGroceryState,
  type GroceryOperationOutcome,
} from "@/hooks/use-grocery-agent";
import { useSubmitForm } from "@/hooks/use-submit-form";
import { useKrogerConnection } from "@/hooks/use-kroger-connection";
import { cartSubtotal, type DisplayMessage } from "@/lib/grocery-state";
import { GROCERY_SUGGESTIONS } from "@/lib/grocery-suggestions";
import { firstParam } from "@/lib/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ANDROID_HEADER_HEIGHT = 56;

export function GroceryChat() {
  const router = useRouter();
  const prompt = firstParam(useLocalSearchParams<{ prompt?: string | string[] }>().prompt);
  const insets = useSafeAreaInsets();
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [reasoningDurations, setReasoningDurations] = useState<Record<string, number>>({});
  const { activeThreadId, isRunning, error, failedInput, clearError, retry, send, stop } =
    useGroceryAgent();
  const state = useGroceryState();
  const { messages, isStreaming } = useGroceryMessages();
  const connection = useKrogerConnection();
  const { connected } = connection;
  const latestMessageId = messages.at(-1)?.id;
  const listRef = useRef<FlatList<DisplayMessage>>(null);
  const nearBottomRef = useRef(true);
  const contentHeightRef = useRef(0);
  const layoutHeightRef = useRef(0);

  const handleScroll = useCallback(({ nativeEvent }: { nativeEvent: NativeScrollEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    nearBottomRef.current = distanceFromBottom < 80;
  }, []);
  // Anchor to the bottom with an explicitly clamped offset: scrollToEnd leaves a
  // stale offset behind when the content shrinks (new chat) or the viewport
  // resizes (keyboard), which shows as phantom blank space.
  const followStream = useCallback(() => {
    if (!nearBottomRef.current) return;
    const offset = Math.max(0, contentHeightRef.current - layoutHeightRef.current);
    listRef.current?.scrollToOffset({ animated: false, offset });
  }, []);
  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeightRef.current = height;
      followStream();
    },
    [followStream],
  );
  const handleLayout = useCallback(
    ({ nativeEvent }: { nativeEvent: { layout: { height: number } } }) => {
      layoutHeightRef.current = nativeEvent.layout.height;
      followStream();
    },
    [followStream],
  );
  const sendAndFollow = useCallback(
    (content: string) => {
      nearBottomRef.current = true;
      return send(content);
    },
    [send],
  );

  const openLatestList = useCallback(() => router.push("/list"), [router]);
  const openListSave = useCallback(
    () => router.push({ pathname: "/list", params: { save: "1" } }),
    [router],
  );
  const openRecipeSave = useCallback(
    () => router.push({ pathname: "/saved-recipes", params: { save: "1" } }),
    [router],
  );
  const confirmAddToCart = useCallback(() => {
    setCartDialogOpen(true);
  }, []);
  const recordReasoningDuration = useCallback((messageId: string, seconds: number) => {
    setReasoningDurations((current) =>
      current[messageId] === seconds ? current : { ...current, [messageId]: seconds },
    );
  }, []);
  const renderMessage = useCallback<ListRenderItem<DisplayMessage>>(
    ({ item: message }) => (
      <MessageItem
        completedReasoningDuration={reasoningDurations[message.id]}
        isStreaming={isStreaming && message.id === latestMessageId}
        message={message}
        onReasoningDurationComplete={recordReasoningDuration}
      />
    ),
    [isStreaming, latestMessageId, reasoningDurations, recordReasoningDuration],
  );

  return (
    <KeyboardView
      automaticOffset={process.env.EXPO_OS !== "android"}
      behavior={process.env.EXPO_OS === "android" ? "height" : undefined}
      offset={process.env.EXPO_OS === "android" ? insets.top + ANDROID_HEADER_HEIGHT : undefined}
    >
      <FlatList
        ref={listRef}
        className="w-full max-w-3xl flex-1 self-center"
        contentContainerClassName="grow gap-3 px-4 py-3 sm:px-6"
        contentInsetAdjustmentBehavior="automatic"
        data={messages}
        keyExtractor={messageKey}
        keyboardDismissMode={process.env.EXPO_OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        onScroll={handleScroll}
        renderItem={renderMessage}
        scrollEventThrottle={64}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<ChatEmptyState disabled={isRunning} onSend={sendAndFollow} />}
        ListFooterComponent={
          <View className="gap-3">
            <GroceryStateCard
              state={state}
              adding={isRunning}
              connected={connected}
              onOpenList={openLatestList}
              onAddToCart={confirmAddToCart}
              onSaveList={openListSave}
              onSaveRecipe={state.recipe ? openRecipeSave : undefined}
            />
            {messages.length > 0 && state.shopping_list?.length ? (
              <KrogerConnectionCard connection={connection} />
            ) : null}
            {error ? (
              <View className="gap-2">
                <Alert title={error} variant="destructive" />
                <View className="flex-row justify-end gap-2">
                  {failedInput ? (
                    <Button
                      accessibilityLabel="Retry failed message"
                      disabled={isRunning}
                      onPress={() => void retry()}
                      size="sm"
                      variant="secondary"
                    >
                      Retry
                    </Button>
                  ) : null}
                  <Button
                    accessibilityLabel="Dismiss chat error"
                    onPress={clearError}
                    size="sm"
                    variant="ghost"
                  >
                    Dismiss
                  </Button>
                </View>
              </View>
            ) : null}
          </View>
        }
      />
      <SafeArea className="flex-none border-t border-border" edges={["bottom"]}>
        <View className="w-full max-w-3xl self-center px-4 py-3 sm:px-6">
          <ChatComposer
            key={`${activeThreadId ?? "grocery"}:${prompt}`}
            initialMessage={prompt}
            isRunning={isRunning}
            onSend={sendAndFollow}
            onStop={stop}
          />
        </View>
      </SafeArea>
      <AddToCartDialog
        itemCount={state.product_matches?.length ?? 0}
        subtotal={cartSubtotal(state.cart ?? [])}
        open={cartDialogOpen}
        onOpenChange={setCartDialogOpen}
        onConfirm={() => void send(ADD_TO_CART_MESSAGE)}
      />
    </KeyboardView>
  );
}

const ChatEmptyState = memo(function ChatEmptyState({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (content: string) => Promise<GroceryOperationOutcome>;
}) {
  return (
    <View className="gap-4 py-6">
      <View className="size-14 items-center justify-center rounded-2xl bg-muted">
        <Icon as={Sparkles} className="size-6.5 text-primary" />
      </View>
      <Text variant="h3">A good plan starts with you.</Text>
      <Text className="text-muted-foreground">
        Tell me what you’d like to cook, how many people, or what you’d like to spend.
      </Text>
      <View className="w-full items-start gap-2">
        {GROCERY_SUGGESTIONS.map((suggestion) => (
          <Chip
            key={suggestion.title}
            accessibilityLabel={suggestion.title}
            disabled={disabled}
            onPress={() => void onSend(suggestion.message)}
          >
            {suggestion.title}
          </Chip>
        ))}
      </View>
    </View>
  );
});

function messageKey(message: DisplayMessage) {
  return message.id;
}

const UserMessage = memo(function UserMessage({ content, id }: { content: string; id: string }) {
  return (
    <View className="w-full items-end" nativeID={id}>
      <View className="max-w-9/10 rounded-2xl rounded-br-sm bg-primary-surface px-4 py-3">
        <Text selectable>{content}</Text>
      </View>
    </View>
  );
});

const MessageItem = memo(function MessageItem({
  completedReasoningDuration,
  isStreaming,
  message,
  onReasoningDurationComplete,
}: {
  completedReasoningDuration?: number;
  isStreaming: boolean;
  message: DisplayMessage;
  onReasoningDurationComplete: (messageId: string, seconds: number) => void;
}) {
  if (message.role === "user") {
    return <UserMessage content={message.content} id={message.id} />;
  }

  return (
    <View className="w-full items-start" collapsable nativeID={message.id}>
      {message.role === "reasoning" ? (
        <ReasoningSection
          completedDuration={completedReasoningDuration}
          content={message.content}
          isStreaming={isStreaming}
          messageId={message.id}
          onDurationComplete={onReasoningDurationComplete}
        />
      ) : message.role === "tool" ? (
        <ToolCallSection
          name={message.name}
          parameters={message.parameters}
          result={message.result}
          status={message.status}
        />
      ) : (
        <View className="w-full py-3">
          <MarkdownText className="min-w-0 self-start" content={message.content} />
        </View>
      )}
    </View>
  );
});

const ChatComposer = memo(function ChatComposer({
  initialMessage,
  isRunning,
  onSend,
  onStop,
}: {
  initialMessage: string;
  isRunning: boolean;
  onSend: (content: string) => Promise<GroceryOperationOutcome>;
  onStop: () => Promise<GroceryOperationOutcome>;
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useSubmitForm<{ message: string }>({ defaultValues: { message: initialMessage } });
  const submit = handleSubmit(async ({ message }) => {
    const content = message.trim();
    if (!content || isRunning) return;

    Keyboard.dismiss();
    reset();
    const outcome = await onSend(content);
    if (outcome.status === "failed") reset({ message: content });
  });

  return (
    <FormField
      control={control}
      name="message"
      rules={{ validate: (value) => value.trim().length > 0 }}
      render={({ field }) => (
        <PromptInput
          className="flex-row items-end gap-2 rounded-2xl bg-card p-2"
          clearOnSend={false}
          onChangeText={field.onChange}
          onSend={() => void submit()}
          onStop={() => void onStop()}
          streaming={isRunning || isSubmitting}
          value={field.value}
        >
          <View className="min-w-0 flex-1">
            <PromptInputTextarea
              testID="chat-message"
              ref={field.ref}
              onBlur={field.onBlur}
              placeholder="Ask about meals or groceries…"
            />
          </View>
          <PromptInputSend testID="chat-send" />
        </PromptInput>
      )}
    />
  );
});

function formatReasoningDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

function ReasoningSection({
  completedDuration,
  content,
  isStreaming,
  messageId,
  onDurationComplete,
}: {
  completedDuration?: number;
  content: string;
  isStreaming: boolean;
  messageId: string;
  onDurationComplete: (messageId: string, seconds: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(completedDuration ?? null);

  useEffect(() => {
    if (!isStreaming) {
      if (startedAtRef.current !== null) {
        const duration = Math.max(1, Math.ceil((Date.now() - startedAtRef.current) / 1000));
        setElapsedSeconds(duration);
        onDurationComplete(messageId, duration);
        startedAtRef.current = null;
      }
      return;
    }

    startedAtRef.current ??= Date.now();
    const updateElapsed = () => {
      setElapsedSeconds(Math.floor((Date.now() - (startedAtRef.current ?? Date.now())) / 1000));
    };
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isStreaming, messageId, onDurationComplete]);

  const reasoningLabel = isStreaming
    ? elapsedSeconds && elapsedSeconds > 0
      ? `Thinking for ${formatReasoningDuration(elapsedSeconds)}`
      : "Thinking…"
    : elapsedSeconds === null
      ? "Thought"
      : `Thought for ${formatReasoningDuration(elapsedSeconds)}`;

  return (
    <Disclosure
      className="w-full"
      onOpenChange={setExpanded}
      open={expanded}
      label={reasoningLabel}
    >
      <View className="ml-2 self-start border-l border-border py-1 pl-3.5">
        <Text className="leading-5" variant="muted">
          {content}
        </Text>
      </View>
    </Disclosure>
  );
}

function ToolCallSection({
  name,
  parameters,
  result,
  status,
}: {
  name: string;
  parameters: unknown;
  result?: unknown;
  status: "running" | "complete" | "failed";
}) {
  const [expanded, setExpanded] = useState(false);
  const label = toolLabel(name);
  return (
    <Disclosure
      className="w-full"
      onOpenChange={setExpanded}
      open={expanded}
      label={`${label} · ${status === "running" ? "Running" : status === "failed" ? "Failed" : "Done"}`}
    >
      {expanded ? (
        <View className="ml-2 max-h-39 border-l border-border py-1 pl-3.5">
          <ScrollView nestedScrollEnabled>
            <Text className="mb-0.5 font-semibold text-muted-foreground" variant="small">
              Input
            </Text>
            <Text className="mb-2 leading-4.5" selectable variant="muted">
              {formatToolValue(parameters)}
            </Text>
            {status !== "running" ? (
              <>
                <Text className="mb-0.5 font-semibold text-muted-foreground" variant="small">
                  Result
                </Text>
                <Text className="mb-2 leading-4.5" selectable variant="muted">
                  {formatToolValue(result)}
                </Text>
              </>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </Disclosure>
  );
}

function toolLabel(name: string): string {
  const labels: Record<string, string> = {
    set_shopping_list: "Created shopping list",
    set_product_matches: "Matched Kroger products",
    update_cart: "Updated Kroger cart",
    set_meal_plan: "Created meal plan",
    set_weekly_deals: "Saved weekly deals",
    mark_list_ready: "Prepared grocery list",
    get_current_date: "Checked current date",
    get_weekly_deals: "Checked weekly deals",
    get_shopping_profile: "Checked shopping profile",
    get_meal_planning_context: "Checked meal planning context",
    search_products: "Searched Kroger products",
    web_search: "Searched the web",
    load_web_page: "Read web page",
  };
  if (labels[name]) return labels[name];
  const words = name.split("_").filter(Boolean).join(" ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

function formatToolValue(value: unknown): string {
  if (typeof value === "string") return value || "None";
  if (value === undefined) return "None";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return typeof value === "bigint" ? value.toString() : "Unserializable value";
  }
}
