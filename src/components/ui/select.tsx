import { NativePicker } from "./native-picker";
import { useState } from "react";
import { Platform, View } from "react-native";
import { UIHost } from "@/components/ui/native-host";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}
export interface SelectProps {
  className?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}
export function Select({
  className,
  placeholder = "Select...",
  options,
  value,
  onValueChange,
  label,
  searchable,
  searchPlaceholder = "Search...",
}: SelectProps) {
  const [search, setSearch] = useState("");
  const filtered = options.filter(
    (option) => option.value === value || option.label.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <View className={cn("gap-2", className)}>
      {label && Platform.OS !== "android" ? <Text variant="small">{label}</Text> : null}
      {searchable ? (
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={searchPlaceholder}
          accessibilityLabel={searchPlaceholder}
        />
      ) : null}
      <UIHost className="min-h-14 w-full" matchContents={{ vertical: true }}>
        <NativePicker
          label={label ?? placeholder}
          value={value ?? ""}
          onValueChange={(next) => {
            if (next !== "") onValueChange?.(next);
          }}
          options={[{ value: "", label: placeholder }, ...filtered]}
        />
      </UIHost>
      {filtered.length === 0 ? <Text variant="muted">No results</Text> : null}
    </View>
  );
}
