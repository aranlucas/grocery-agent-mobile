import { forwardRef, useState } from "react";
import { View } from "react-native";
import {
  NativeInput,
  type NativeInputProps,
  type NativeInputRef,
} from "@/components/ui/native-input";
import { cn } from "@/lib/utils";

export type InputProps = NativeInputProps & {
  variant?: "default" | "ghost";
  size?: "sm" | "md" | "lg";
};

export const Input = forwardRef<NativeInputRef, InputProps>(function Input(
  { variant = "default", size = "md", className, onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={cn(
        "min-h-14 flex-row items-center rounded-xl",
        variant === "default" && "border border-input bg-card",
        focused && "border-primary",
        className,
      )}
    >
      <NativeInput
        ref={ref}
        className="flex-1"
        textStyle={{ fontSize: size === "lg" ? 18 : 16 }}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        {...props}
      />
    </View>
  );
});
