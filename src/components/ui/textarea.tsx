import { forwardRef } from "react";
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
  { variant = "default", className, ...props },
  ref,
) {
  return (
    <View
      className={cn(
        "min-h-24 rounded-xl",
        variant === "default" && "border border-input bg-background",
        className,
      )}
    >
      <NativeInput ref={ref} multiline numberOfLines={4} {...props} />
    </View>
  );
});
