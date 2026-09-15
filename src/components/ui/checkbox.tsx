import { Checkbox as ExpoCheckbox } from "@expo/ui";
import type { AccessibilityProps } from "react-native";
import { accessibilityModifiers, controlSizeModifiers } from "@/components/ui/native-accessibility";
import { UIHost } from "@/components/ui/native-host";
import { cn } from "@/lib/utils";

export type CheckboxProps = AccessibilityProps & {
  className?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  testID?: string;
};

export function Checkbox({
  checked = false,
  onCheckedChange,
  className,
  disabled = false,
  testID,
  ...accessibility
}: CheckboxProps) {
  return (
    <UIHost
      className={cn("min-h-14 min-w-14 justify-center", className)}
      matchContents
      accessible={false}
    >
      <ExpoCheckbox
        value={checked}
        onValueChange={onCheckedChange ?? (() => {})}
        disabled={disabled}
        modifiers={[...controlSizeModifiers(), ...accessibilityModifiers(accessibility)]}
        testID={testID}
      />
    </UIHost>
  );
}
