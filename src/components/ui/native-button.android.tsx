import { Button, OutlinedButton, TextButton, Shape } from "@expo/ui/jetpack-compose";
import {
  height,
  width as nativeWidth,
  testID as nativeTestID,
} from "@expo/ui/jetpack-compose/modifiers";
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
  const Control =
    variant === "outline"
      ? OutlinedButton
      : variant === "ghost" || variant === "link"
        ? TextButton
        : Button;
  return (
    <Control
      onClick={onPress}
      enabled={!disabled}
      colors={{
        containerColor: background,
        contentColor: foreground,
        disabledContainerColor: background,
        disabledContentColor: foreground,
      }}
      shape={Shape.RoundedCorner({
        cornerRadii: { topStart: 12, topEnd: 12, bottomStart: 12, bottomEnd: 12 },
      })}
      modifiers={[
        height(56),
        ...(width ? [nativeWidth(width)] : []),
        ...accessibilityModifiers(accessibility),
        ...(testID ? [nativeTestID(testID)] : []),
      ]}
    >
      {children}
    </Control>
  );
}
