import { useWindowDimensions } from "react-native";
import { Button } from "@expo/ui";
import { tint, buttonBorderShape } from "@expo/ui/swift-ui/modifiers";
import { accessibilityModifiers } from "./native-accessibility";
import type { NativeButtonProps } from "./native-button";
export function NativeButton({
  variant,
  onPress,
  disabled,
  children,
  width,
  background,
  foreground,
  testID,
  ...accessibility
}: NativeButtonProps) {
  const { fontScale } = useWindowDimensions();
  const filled = variant === "default" || variant === "secondary" || variant === "destructive";
  return (
    <Button
      variant={filled ? "filled" : variant === "outline" ? "outlined" : "text"}
      onPress={onPress}
      disabled={disabled}
      style={{ height: Math.max(56, 32 + 24 * fontScale), width }}
      modifiers={[
        tint(filled ? background : foreground),
        buttonBorderShape("roundedRectangle", 12),
        ...accessibilityModifiers(accessibility),
      ]}
      testID={testID}
    >
      {children}
    </Button>
  );
}
