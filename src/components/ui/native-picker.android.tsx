import {
  DropdownMenuItem,
  ExposedDropdownMenu,
  ExposedDropdownMenuBox,
  OutlinedTextField,
  Text,
  Icon,
  Shape,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, height, menuAnchor } from "@expo/ui/jetpack-compose/modifiers";
import ExpandMore from "@expo/material-symbols/keyboard_arrow_down.xml";
import { useEffect, useState } from "react";
import { accessibilityModifiers } from "./native-accessibility";
import type { NativePickerProps } from "./native-picker";
import { useThemeColor } from "@/hooks/use-theme-color";
export function NativePicker({ options, value, label, onValueChange }: NativePickerProps) {
  const [expanded, setExpanded] = useState(false);
  const selectedLabel = options.find((item) => item.value === value)?.label ?? "";
  const text = useNativeState(selectedLabel);
  useEffect(() => {
    text.value = selectedLabel;
  }, [text, selectedLabel]);
  const foreground = useThemeColor("--color-foreground", "#17201a");
  const border = useThemeColor("--color-input", "#dfe5dc");
  const primary = useThemeColor("--color-primary", "#15803d");
  return (
    <ExposedDropdownMenuBox
      expanded={expanded}
      onExpandedChange={setExpanded}
      modifiers={[fillMaxWidth()]}
    >
      <OutlinedTextField
        value={text}
        readOnly
        singleLine
        shape={Shape.RoundedCorner({
          cornerRadii: {
            topStart: 12,
            topEnd: 12,
            bottomStart: 12,
            bottomEnd: 12,
          },
        })}
        colors={{
          focusedTextColor: foreground,
          unfocusedTextColor: foreground,
          focusedIndicatorColor: primary,
          unfocusedIndicatorColor: border,
        }}
        modifiers={[
          menuAnchor(),
          fillMaxWidth(),
          height(56),
          ...accessibilityModifiers({ accessibilityLabel: label }),
        ]}
      >
        <OutlinedTextField.Label>
          <Text>{label}</Text>
        </OutlinedTextField.Label>
        <OutlinedTextField.TrailingIcon>
          <Icon source={ExpandMore} tint={foreground} />
        </OutlinedTextField.TrailingIcon>
      </OutlinedTextField>
      <ExposedDropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              onValueChange(option.value);
              setExpanded(false);
            }}
          >
            <DropdownMenuItem.Text>
              <Text>{option.label}</Text>
            </DropdownMenuItem.Text>
          </DropdownMenuItem>
        ))}
      </ExposedDropdownMenu>
    </ExposedDropdownMenuBox>
  );
}
