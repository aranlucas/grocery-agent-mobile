import { Button } from "@expo/ui";
import type { ReactNode } from "react";
import type { NativeAccessibility } from "./native-accessibility";
export interface NativeButtonProps extends NativeAccessibility {
  variant: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  onPress?: () => void;
  disabled: boolean;
  children: ReactNode;
  width?: number;
  background: string;
  foreground: string;
  testID?: string;
}
export function NativeButton({
  variant,
  onPress,
  disabled,
  children,
  width,
  testID,
}: NativeButtonProps) {
  return (
    <Button
      variant={
        variant === "outline"
          ? "outlined"
          : variant === "ghost" || variant === "link"
            ? "text"
            : "filled"
      }
      onPress={onPress}
      disabled={disabled}
      style={{ height: 56, width }}
      testID={testID}
    >
      {children}
    </Button>
  );
}
