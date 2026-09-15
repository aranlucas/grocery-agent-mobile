import { defaultMinSize } from "@expo/ui/jetpack-compose/modifiers";
import type { NativeAccessibility } from "./native-accessibility";
export function accessibilityModifiers(_props: NativeAccessibility) {
  // Stable Expo UI has no custom Compose semantics API. UIHost owns the RN accessibility node.
  return [];
}
export function controlSizeModifiers() {
  return [defaultMinSize({ minWidth: 56, minHeight: 56 })];
}
export function accessibilityHostProps(props: NativeAccessibility, onActivate?: () => void) {
  const { "aria-invalid": _invalid, ...accessibility } = props;
  return {
    ...accessibility,
    accessible: true,
    onPress: props.accessibilityState?.disabled ? undefined : onActivate,
    accessibilityActions: onActivate ? [{ name: "activate" as const }] : props.accessibilityActions,
    onAccessibilityAction: onActivate
      ? () => {
          if (!props.accessibilityState?.disabled) onActivate();
        }
      : props.onAccessibilityAction,
  };
}
