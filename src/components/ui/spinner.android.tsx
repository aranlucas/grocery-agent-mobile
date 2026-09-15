import { CircularProgressIndicator } from "@expo/ui/jetpack-compose";
import { size as nativeSize } from "@expo/ui/jetpack-compose/modifiers";
import { UIHost } from "@/components/ui/native-host";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { SpinnerProps } from "./spinner";
export function Spinner({ size = "md", color, className, ...props }: SpinnerProps) {
  const foreground = useThemeColor("--color-foreground", "#17201a");
  const dimension = size === "lg" ? 36 : size === "sm" ? 16 : 24;
  return (
    <UIHost className={className} matchContents accessibilityRole="progressbar" {...props}>
      <CircularProgressIndicator
        color={color ?? foreground}
        strokeWidth={2}
        modifiers={[nativeSize(dimension, dimension)]}
      />
    </UIHost>
  );
}
