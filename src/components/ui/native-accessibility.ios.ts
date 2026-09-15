import {
  accessibilityLabel,
  accessibilityHint,
  accessibilityValue,
  accessibilityAddTraits,
  frame,
} from "@expo/ui/swift-ui/modifiers";
import type { NativeAccessibility } from "./native-accessibility";
export function accessibilityHostProps(_props: NativeAccessibility, _onActivate?: () => void) {
  return {};
}
export function accessibilityModifiers(props: NativeAccessibility) {
  return [
    ...(props.accessibilityLabel ? [accessibilityLabel(props.accessibilityLabel)] : []),
    ...(props.accessibilityHint ? [accessibilityHint(props.accessibilityHint)] : []),
    ...(props.accessibilityValue?.text ? [accessibilityValue(props.accessibilityValue.text)] : []),
    ...(props.accessibilityState?.selected ? [accessibilityAddTraits(["isSelected"])] : []),
  ];
}
export function controlSizeModifiers() {
  return [frame({ minWidth: 56, minHeight: 56 })];
}
