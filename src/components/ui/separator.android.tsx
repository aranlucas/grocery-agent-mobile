import { HorizontalDivider, VerticalDivider } from "@expo/ui/jetpack-compose";
import { UIHost } from "@/components/ui/native-host";
import { useThemeColor } from "@/hooks/use-theme-color";
import { cn } from "@/lib/utils";
import type { SeparatorProps } from "./separator";
export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  const color = useThemeColor("--color-border", "#dfe5dc");
  const Divider = orientation === "horizontal" ? HorizontalDivider : VerticalDivider;
  return (
    <UIHost
      className={cn(orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
      {...props}
    >
      <Divider color={color} thickness={1} />
    </UIHost>
  );
}
