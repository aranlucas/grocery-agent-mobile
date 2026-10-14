import { forwardRef, useState } from "react";
import { View } from "react-native";
import {
  NativeInput,
  type NativeInputProps,
  type NativeInputRef,
} from "@/components/ui/native-input";
import { cn } from "@/lib/utils";

export type TextareaProps = NativeInputProps & {
  variant?: "default" | "ghost";
};

export const Textarea = forwardRef<NativeInputRef, TextareaProps>(function Textarea(
  { variant = "default", className, onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={cn(
        "min-h-24 rounded-xl",
        variant === "default" && "border border-input bg-card",
        focused && "border-primary",
        className,
      )}
    >
      <NativeInput
        ref={ref}
        multiline
        numberOfLines={4}
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
