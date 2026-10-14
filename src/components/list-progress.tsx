import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { GroceryListItem } from "@/lib/household-api";

export function ListProgress({ items }: { items: GroceryListItem[] }) {
  const done = items.filter((item) => item.checked_at).length;
  return (
    <View className="gap-2">
      <Text variant="muted" accessibilityLiveRegion="polite">
        {items.length === 0
          ? "Add your first item below"
          : done === items.length
            ? "All done — everything is checked off"
            : `${items.length - done} to shop · ${done} of ${items.length} checked`}
      </Text>
      {items.length ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Shopping progress"
          accessibilityValue={{ min: 0, max: items.length, now: done }}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${(done / items.length) * 100}%` }}
          />
        </View>
      ) : null}
    </View>
  );
}
