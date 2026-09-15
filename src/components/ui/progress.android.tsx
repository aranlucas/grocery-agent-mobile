import { LinearProgressIndicator } from "@expo/ui/jetpack-compose";
import { UIHost } from "@/components/ui/native-host";
import { useThemeColor } from "@/hooks/use-theme-color";
import { cn } from "@/lib/utils";
import type { ProgressProps } from "./progress";
export function Progress({
  value = 0,
  className,
  indicatorClassName: _indicatorClassName,
  ...props
}: ProgressProps) {
  const color = useThemeColor("--color-primary", "#15803d");
  const trackColor = useThemeColor("--color-muted", "#eef2e8");
  return (
    <UIHost className={cn("h-2 w-full", className)} {...props}>
      <LinearProgressIndicator
        progress={Math.min(100, Math.max(0, value)) / 100}
        color={color}
        trackColor={trackColor}
      />
    </UIHost>
  );
}
