import { defaultMinSize, semantics } from "@expo/ui/jetpack-compose/modifiers";
import type { NativeAccessibility } from "./native-accessibility";
export function accessibilityModifiers(props: NativeAccessibility) {
  return [
    semantics({
      contentDescription: props.accessibilityLabel,
      stateDescription:
        [props.accessibilityValue?.text, props.accessibilityHint].filter(Boolean).join(". ") ||
        undefined,
      error: props["aria-invalid"] ? (props.accessibilityHint ?? "Invalid value") : undefined,
      selected: props.accessibilityState?.selected,
      role: props.accessibilityRole,
      checked:
        typeof props.accessibilityState?.checked === "boolean"
          ? props.accessibilityState.checked
          : undefined,
    }),
  ];
}
export function controlSizeModifiers() {
  return [defaultMinSize({ minWidth: 56, minHeight: 56 })];
}
