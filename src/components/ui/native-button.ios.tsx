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
  const filled = variant === "default" || variant === "secondary" || variant === "destructive";
  return (
    <Button
      variant={filled ? "filled" : variant === "outline" ? "outlined" : "text"}
      onPress={onPress}
      disabled={disabled}
      style={{ height: 56, width }}
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
