import type { LucideIcon } from "lucide-react-native";
import { Pressable } from "react-native";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export interface HeaderActionButtonProps {
  accessibilityLabel: string;
  icon: LucideIcon;
  onPress: () => void;
  className?: string;
}

export function HeaderActionButton({
  accessibilityLabel,
  icon,
  onPress,
  className,
}: HeaderActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={cn(
        "active:bg-muted min-h-14 min-w-14 items-center justify-center rounded-full",
        className,
      )}
      onPress={onPress}
    >
      <Icon as={icon} className="text-foreground size-5" />
    </Pressable>
  );
}
