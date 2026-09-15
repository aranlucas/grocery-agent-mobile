import { View } from "react-native";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface ChipProps extends Omit<ButtonProps, "variant" | "size"> {
  children: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClose?: () => void;
}

export function Chip({
  selected,
  onClose,
  children,
  variant,
  size,
  accessibilityState,
  ...props
}: ChipProps) {
  return (
    <View className="flex-row items-center">
      <Button
        {...props}
        size={size}
        variant={selected ? "default" : (variant ?? "outline")}
        accessibilityState={{ ...accessibilityState, selected }}
      >
        {children}
      </Button>
      {onClose ? (
        <Button
          variant="ghost"
          disabled={props.disabled}
          accessibilityLabel={`Remove ${children}`}
          onPress={onClose}
        >
          ×
        </Button>
      ) : null}
    </View>
  );
}
