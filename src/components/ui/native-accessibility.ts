import type { AccessibilityProps } from "react-native";
import type { ModifierConfig } from "@expo/ui/swift-ui/modifiers";
export type NativeAccessibility = AccessibilityProps & { "aria-invalid"?: boolean };
export function accessibilityModifiers(_props: NativeAccessibility): ModifierConfig[] {
  return [];
}
export function controlSizeModifiers(): ModifierConfig[] {
  return [];
}
