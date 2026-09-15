import { TextInput, useNativeState, type TextInputProps, type TextInputRef } from "@expo/ui";
import { forwardRef, useEffect, useRef } from "react";
import type { AccessibilityProps } from "react-native";
import { accessibilityModifiers, controlSizeModifiers } from "@/components/ui/native-accessibility";
import { UIHost } from "@/components/ui/native-host";
import { useThemeColor } from "@/hooks/use-theme-color";

export type NativeInputRef = TextInputRef;
export type NativeInputProps = Omit<TextInputProps, "value" | "ref"> &
  AccessibilityProps & {
    className?: string;
    value?: string;
    "aria-invalid"?: boolean;
  };

/** Adapt RHF's controlled strings to Expo UI's native observable state. */
export const NativeInput = forwardRef<NativeInputRef, NativeInputProps>(function NativeInput(
  {
    value,
    defaultValue,
    onChangeText,
    className,
    accessibilityLabel,
    accessibilityHint,
    accessibilityState,
    "aria-invalid": invalid,
    textStyle,
    ...props
  },
  ref,
) {
  const text = useNativeState(value ?? defaultValue ?? "");
  const pendingEdits = useRef<string[]>([]);
  const foreground = useThemeColor("--color-foreground", "#17201a");
  const muted = useThemeColor("--color-muted-foreground", "#667067");

  useEffect(() => {
    if (value === undefined) return;
    // RHF echoes native edits back as controlled values. A delayed echo must not
    // overwrite newer text that the native field has already received.
    const acknowledged = pendingEdits.current.lastIndexOf(value);
    if (acknowledged >= 0) {
      pendingEdits.current.splice(0, acknowledged + 1);
      return;
    }
    pendingEdits.current = [];
    if (text.value !== value) text.value = value;
  }, [text, value]);

  return (
    <UIHost className={className} matchContents={{ vertical: true }} accessible={false}>
      <TextInput
        ref={ref}
        placeholderTextColor={muted}
        cursorColor={foreground}
        selectionColor={foreground}
        {...props}
        style={{ padding: 16, ...props.style }}
        modifiers={[
          ...controlSizeModifiers(),
          ...accessibilityModifiers({
            accessibilityLabel,
            accessibilityHint,
            accessibilityState,
            "aria-invalid": invalid,
          }),
          ...(props.modifiers ?? []),
        ]}
        value={text}
        onChangeText={(next) => {
          if (value !== undefined && onChangeText) pendingEdits.current.push(next);
          onChangeText?.(next);
        }}
        textStyle={{ fontSize: 16, color: foreground, ...textStyle }}
      />
    </UIHost>
  );
});
