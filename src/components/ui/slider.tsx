import { Slider as ExpoSlider } from "@expo/ui";
import { accessibilityModifiers, controlSizeModifiers } from "@/components/ui/native-accessibility";
import { UIHost } from "@/components/ui/native-host";
import type { NativeAccessibility } from "@/components/ui/native-accessibility";
import { cn } from "@/lib/utils";
export interface SliderProps extends NativeAccessibility {
  className?: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  onValueChange?: (value: number) => void;
  testID?: string;
}
export function Slider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  size: _size,
  onValueChange,
  className,
  testID,
  ...accessibility
}: SliderProps) {
  return (
    <UIHost
      className={cn("min-h-14 w-full", className)}
      matchContents={{ vertical: true }}
      accessible={false}
    >
      <ExpoSlider
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={onValueChange ?? (() => {})}
        modifiers={[...controlSizeModifiers(), ...accessibilityModifiers(accessibility)]}
        testID={testID}
      />
    </UIHost>
  );
}
