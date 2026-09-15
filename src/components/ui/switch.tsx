import { Switch as ExpoSwitch } from "@expo/ui";
import type { AccessibilityProps } from "react-native";
import {
  accessibilityHostProps,
  accessibilityModifiers,
  controlSizeModifiers,
} from "@/components/ui/native-accessibility";
import { UIHost } from "@/components/ui/native-host";
import { cn } from "@/lib/utils";
export interface SwitchProps extends AccessibilityProps {
  className?: string;
  value?: boolean;
  disabled?: boolean;
  onValueChange?: (value: boolean) => void;
  testID?: string;
}
export function Switch({
  className,
  value = false,
  disabled,
  onValueChange,
  testID,
  ...accessibility
}: SwitchProps) {
  return (
    <UIHost
      className={cn("min-h-14 min-w-14", className)}
      matchContents
      accessible={false}
      {...accessibilityHostProps(
        {
          ...accessibility,
          accessibilityRole: "switch",
          accessibilityState: {
            ...accessibility.accessibilityState,
            checked: value,
            disabled,
          },
        },
        () => onValueChange?.(!value),
      )}
    >
      <ExpoSwitch
        value={value}
        onValueChange={onValueChange ?? (() => {})}
        disabled={disabled}
        modifiers={[...controlSizeModifiers(), ...accessibilityModifiers(accessibility)]}
        testID={testID}
      />
    </UIHost>
  );
}
