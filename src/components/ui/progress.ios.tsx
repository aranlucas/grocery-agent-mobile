import { ProgressView } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
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
  return (
    <UIHost className={cn("h-2 w-full", className)} {...props}>
      <ProgressView value={Math.min(100, Math.max(0, value)) / 100} modifiers={[tint(color)]} />
    </UIHost>
  );
}
