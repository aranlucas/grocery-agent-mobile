import { Host, type UniversalHostProps } from "@expo/ui";
import { useUniwind, withUniwind } from "uniwind";
import { useThemeColor } from "@/hooks/use-theme-color";

const StyledHost = withUniwind(Host);

/** The app owns safe-area/keyboard insets; native controls share its theme. */
export function UIHost(props: UniversalHostProps & { className?: string }) {
  const { theme } = useUniwind();
  const primary = useThemeColor("--color-primary", "#15803d");
  return (
    <StyledHost
      colorScheme={theme === "dark" ? "dark" : "light"}
      ignoreSafeArea="all"
      seedColor={primary}
      {...props}
    />
  );
}
