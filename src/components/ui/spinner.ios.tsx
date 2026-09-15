import { ProgressView } from "@expo/ui/swift-ui";
import { controlSize, tint } from "@expo/ui/swift-ui/modifiers";
import { UIHost } from "@/components/ui/native-host";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { SpinnerProps } from "./spinner";
export function Spinner({ size = "md", color, className, ...props }: SpinnerProps) {
  const foreground = useThemeColor("--color-foreground", "#17201a");
  return (
    <UIHost className={className} matchContents accessibilityRole="progressbar" {...props}>
      <ProgressView
        modifiers={[
          tint(color ?? foreground),
          controlSize(size === "lg" ? "large" : size === "sm" ? "small" : "regular"),
        ]}
      />
    </UIHost>
  );
}
