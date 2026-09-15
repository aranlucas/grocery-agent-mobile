import { forwardRef, useImperativeHandle, useRef } from "react";
import {
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  type TextStyle,
} from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { NativeInputProps, NativeInputRef } from "./native-input";

// Stable Expo UI's BasicTextField does not expose Android accessibility labels.
// Keep the public form adapter while using RN's supported editable/accessibility API.
export const NativeInput = forwardRef<NativeInputRef, NativeInputProps>(function NativeInput(
  {
    modifiers: _modifiers,
    textStyle,
    style,
    onContentSizeChange,
    onSelectionChange,
    onSubmitEditing,
    selection,
    autoComplete,
    rows,
    numberOfLines,
    textAlign,
    ...props
  },
  ref,
) {
  const input = useRef<TextInputInstance>(null);
  const foreground = useThemeColor("--color-foreground", "#17201a");
  const muted = useThemeColor("--color-muted-foreground", "#667067");
  useImperativeHandle(
    ref,
    () => ({
      focus: () => input.current?.focus(),
      blur: () => input.current?.blur(),
      clear: () => input.current?.clear(),
      isFocused: () => input.current?.isFocused() ?? false,
      setSelection: async (start, end) =>
        input.current?.setNativeProps({ selection: { start, end } }),
    }),
    [],
  );
  return (
    <TextInput
      ref={input}
      placeholderTextColor={muted}
      cursorColor={foreground}
      selectionColor={foreground}
      textAlignVertical={props.multiline ? "top" : "center"}
      {...props}
      textAlign={textAlign === "auto" || textAlign === "justify" ? undefined : textAlign}
      autoComplete={autoComplete as TextInputProps["autoComplete"]}
      numberOfLines={numberOfLines ?? rows}
      selection={selection?.value}
      onSelectionChange={
        onSelectionChange ? (event) => onSelectionChange(event.nativeEvent.selection) : undefined
      }
      onContentSizeChange={
        onContentSizeChange
          ? (event) => onContentSizeChange(event.nativeEvent.contentSize)
          : undefined
      }
      onSubmitEditing={
        onSubmitEditing ? (event) => onSubmitEditing(event.nativeEvent.text) : undefined
      }
      style={[
        { minHeight: 56, padding: 16, fontSize: 16, color: foreground },
        textStyle as TextStyle,
        style as TextStyle,
      ]}
    />
  );
});
