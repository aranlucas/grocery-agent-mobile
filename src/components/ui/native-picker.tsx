import { Picker } from "@expo/ui";
import type { SelectOption } from "./select";
export interface NativePickerProps {
  options: SelectOption[];
  value: string;
  label: string;
  onValueChange: (value: string) => void;
}
export function NativePicker({ options, value, onValueChange }: NativePickerProps) {
  return (
    <Picker selectedValue={value} onValueChange={onValueChange} appearance="menu">
      {options.map((option) => (
        <Picker.Item key={option.value} {...option} />
      ))}
    </Picker>
  );
}
