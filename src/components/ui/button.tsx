import { RNHostView, Row, Text as NativeText } from "@expo/ui";
import { View, type PressableProps } from "react-native";
import { useState, type ReactNode } from "react";
import { useResolveClassNames } from "uniwind";
import { UIHost } from "@/components/ui/native-host";
import { NativeButton } from "@/components/ui/native-button";
import { Spinner } from "@/components/ui/spinner";
import { useThemeColor } from "@/hooks/use-theme-color";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<PressableProps, "onPress" | "children" | "style"> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  textClassName?: string;
  children?: string;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  loading?: boolean;
  onPress?: () => void;
}
export function Button({
  variant = "default",
  size = "md",
  className,
  textClassName,
  children,
  icon,
  iconAfter,
  loading,
  disabled,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  testID,
}: ButtonProps) {
  const [width, setWidth] = useState<number>();
  const isDisabled = Boolean(disabled || loading);
  const filled = variant === "default" || variant === "secondary" || variant === "destructive";
  const tone =
    variant === "destructive" ? "destructive" : variant === "secondary" ? "secondary" : "primary";
  const background = useThemeColor(`--color-${tone}`, "#15803d");
  const foreground = useThemeColor(
    filled ? `--color-${tone}-foreground` : "--color-primary",
    filled ? "#ffffff" : "#15803d",
  );
  const customStyle = useResolveClassNames(className ?? "");
  const customTextStyle = useResolveClassNames(textClassName ?? "");
  const textColor = typeof customTextStyle.color === "string" ? customTextStyle.color : foreground;
  return (
    <UIHost
      className={cn("min-h-14 min-w-14", isDisabled && "opacity-50", className)}
      matchContents
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessible={false}
    >
      <NativeButton
        variant={variant}
        onPress={onPress}
        disabled={isDisabled}
        width={customStyle.flex || customStyle.flexGrow || customStyle.width ? width : undefined}
        background={
          typeof customStyle.backgroundColor === "string"
            ? customStyle.backgroundColor
            : filled
              ? background
              : "transparent"
        }
        foreground={textColor}
        testID={testID}
        accessibilityLabel={accessibilityLabel ?? children}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
      >
        <Row spacing={8} alignment="center">
          {loading || icon ? (
            <RNHostView matchContents>
              <View
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                pointerEvents="none"
              >
                {loading ? <Spinner size="sm" color={textColor} /> : icon}
              </View>
            </RNHostView>
          ) : null}
          {children ? (
            <NativeText
              numberOfLines={1}
              textStyle={{
                fontSize: customTextStyle.fontSize ?? (size === "lg" ? 18 : 16),
                fontWeight: "600",
                color: textColor,
              }}
            >
              {children}
            </NativeText>
          ) : null}
          {!loading && iconAfter ? (
            <RNHostView matchContents>
              <View
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                pointerEvents="none"
              >
                {iconAfter}
              </View>
            </RNHostView>
          ) : null}
        </Row>
      </NativeButton>
    </UIHost>
  );
}
