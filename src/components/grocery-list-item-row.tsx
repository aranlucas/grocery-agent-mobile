import { Trash2 } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { type GroceryListItem } from "@/lib/household-api";
import { cn } from "@/lib/utils";

export function GroceryListItemRow({
  item,
  busy = false,
  showSeparator = false,
  onToggle,
  onDelete,
}: {
  item: GroceryListItem;
  busy?: boolean;
  showSeparator?: boolean;
  onToggle: (checked: boolean) => void;
  onDelete: () => void;
}) {
  const checked = Boolean(item.checked_at);

  return (
    <View>
      <View className={cn("min-h-16 flex-row items-center px-4", busy && "opacity-50")}>
        <Checkbox
          accessibilityLabel={`${checked ? "Uncheck" : "Check"} ${item.name}`}
          checked={checked}
          disabled={busy}
          onCheckedChange={onToggle}
        />
        <View className="flex-1 gap-0.5 py-3">
          <Text
            className={cn(checked && "text-muted-foreground line-through")}
            selectable
            variant="large"
          >
            {item.name}
          </Text>
          <Text variant="muted">Quantity {item.quantity}</Text>
        </View>
        <Pressable
          accessibilityLabel={`Remove ${item.name}`}
          accessibilityRole="button"
          className="min-h-14 min-w-14 items-center justify-center active:opacity-60"
          disabled={busy}
          onPress={onDelete}
        >
          <Icon as={Trash2} className="size-5 text-muted-foreground" />
        </Pressable>
      </View>
      {showSeparator ? <Separator className="ml-13 w-auto" /> : null}
    </View>
  );
}
