import { Host } from "@expo/ui/jetpack-compose";
import type { UniversalHostProps } from "@expo/ui";
import { Pressable, View, type PressableProps } from "react-native";
import { useUniwind, withUniwind } from "uniwind";
import { useThemeColor } from "@/hooks/use-theme-color";

const StyledHost = withUniwind(Host);

export function UIHost({
  ignoreSafeArea: _ignoreSafeArea,
  children,
  className,
  onLayout,
  style,
  accessible,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  accessibilityValue,
  accessibilityActions,
  onAccessibilityAction,
  ...props
}: UniversalHostProps & { className?: string; onPress?: () => void }) {
  const { theme } = useUniwind();
  const primary = useThemeColor("--color-primary", "#15803d");
  const native = (
    <StyledHost
      colorScheme={theme === "dark" ? "dark" : "light"}
      ignoreSafeAreaKeyboardInsets
      seedColor={primary}
      {...props}
      style={props.matchContents === true ? undefined : { width: "100%" }}
    >
      {children}
    </StyledHost>
  );
  if (!accessible)
    return (
      <View className={className} onLayout={onLayout} style={style}>
        {native}
      </View>
    );
  return (
    <Pressable
      className={className}
      onLayout={onLayout}
      style={style as PressableProps["style"]}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityValue={accessibilityValue}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      onPress={onPress}
      disabled={accessibilityState?.disabled}
    >
      <View
        importantForAccessibility="no-hide-descendants"
        pointerEvents={onPress ? "none" : "auto"}
      >
        {native}
      </View>
    </Pressable>
  );
}
