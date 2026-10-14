import { CloudOff } from "lucide-react-native";
import { View } from "react-native";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Couldn’t load this page",
  message,
  onRetry,
  retryLabel = "Try again",
  inline = false,
}: {
  title?: string;
  message: string;
  onRetry: () => void;
  retryLabel?: string;
  inline?: boolean;
}) {
  if (inline)
    return (
      <View className="gap-2">
        <Alert title={message} variant="destructive" />
        <Button onPress={onRetry} variant="outline">
          {retryLabel}
        </Button>
      </View>
    );
  return (
    <EmptyState
      icon={<Icon as={CloudOff} className="size-7 text-muted-foreground" />}
      title={title}
      description={message}
      action={{ label: retryLabel, onPress: onRetry }}
    />
  );
}
