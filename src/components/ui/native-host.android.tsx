import { Host } from "@expo/ui/jetpack-compose";
import type { UniversalHostProps } from "@expo/ui";
import { useUniwind, withUniwind } from "uniwind";
import { useThemeColor } from "@/hooks/use-theme-color";

const StyledHost = withUniwind(Host);

export function UIHost({
  ignoreSafeArea: _ignoreSafeArea,
  children,
  ...props
}: UniversalHostProps & { className?: string }) {
  const { theme } = useUniwind();
  const primary = useThemeColor("--color-primary", "#15803d");
  return (
    <StyledHost
      colorScheme={theme === "dark" ? "dark" : "light"}
      ignoreSafeAreaKeyboardInsets
      seedColor={primary}
      {...props}
    >
      {children}
    </StyledHost>
  );
}
