import { Divider } from "@expo/ui/swift-ui";
import { UIHost } from "@/components/ui/native-host";
import { cn } from "@/lib/utils";
import type { SeparatorProps } from "./separator";
export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  return (
    <UIHost
      className={cn(orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
      {...props}
    >
      <Divider />
    </UIHost>
  );
}
