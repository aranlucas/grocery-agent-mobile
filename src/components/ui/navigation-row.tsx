import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export function NavigationRow({
  title,
  description,
  icon,
  onPress,
  destructive,
  testID,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      onPress={onPress}
      className="min-h-18 flex-row items-center gap-3 px-4 py-4 active:bg-muted"
    >
      <View accessible={false} className="size-10 items-center justify-center rounded-xl bg-muted">
        <Icon as={icon} className={cn("size-5 text-primary", destructive && "text-destructive")} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text variant="large" className={destructive ? "text-destructive" : undefined}>
          {title}
        </Text>
        {description ? <Text variant="muted">{description}</Text> : null}
      </View>
      <Icon as={ChevronRight} className="size-5 text-muted-foreground" />
    </Pressable>
  );
}
