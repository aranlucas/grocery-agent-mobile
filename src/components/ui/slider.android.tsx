import { Slider as NativeSlider } from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { accessibilityModifiers, controlSizeModifiers } from "@/components/ui/native-accessibility";
import { UIHost } from "@/components/ui/native-host";
import { useThemeColor } from "@/hooks/use-theme-color";
import { cn } from "@/lib/utils";
import type { SliderProps } from "./slider";
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
  const primary = useThemeColor("--color-primary", "#15803d");
  const muted = useThemeColor("--color-muted", "#eef2e8");
  return (
    <UIHost
      className={cn("min-h-14 w-full", className)}
      matchContents={{ vertical: true }}
      testID={testID}
    >
      <NativeSlider
        value={value}
        min={min}
        max={max}
        enabled={!disabled}
        steps={step > 0 ? Math.max(0, Math.round((max - min) / step) - 1) : 0}
        onValueChange={(next) =>
          onValueChange?.(
            Math.min(
              max,
              Math.max(min, step > 0 ? min + Math.round((next - min) / step) * step : next),
            ),
          )
        }
        colors={{
          thumbColor: primary,
          activeTrackColor: primary,
          inactiveTrackColor: muted,
          activeTickColor: "transparent",
          inactiveTickColor: "transparent",
        }}
        modifiers={[
          fillMaxWidth(),
          ...controlSizeModifiers(),
          ...accessibilityModifiers(accessibility),
        ]}
      />
    </UIHost>
  );
}
