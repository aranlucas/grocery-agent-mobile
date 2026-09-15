import { Picker, Text } from "@expo/ui/swift-ui";
import { pickerStyle, tag, tint, frame } from "@expo/ui/swift-ui/modifiers";
import { accessibilityModifiers } from "./native-accessibility";
import type { NativePickerProps } from "./native-picker";
import { useThemeColor } from "@/hooks/use-theme-color";
export function NativePicker({ options, value, label, onValueChange }: NativePickerProps) {
  const color = useThemeColor("--color-primary", "#15803d");
  return (
    <Picker
      selection={value}
      onSelectionChange={(next) => onValueChange(String(next))}
      modifiers={[
        pickerStyle("menu"),
        tint(color),
        frame({ minHeight: 56, maxWidth: Infinity }),
        ...accessibilityModifiers({ accessibilityLabel: label }),
      ]}
    >
      {options.map((option) => (
        <Text key={option.value} modifiers={[tag(option.value)]}>
          {option.label}
        </Text>
      ))}
    </Picker>
  );
}
