import { forwardRef, type ReactNode } from "react";
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
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export const Input = forwardRef<NativeInputRef, InputProps>(function Input(
  { variant = "default", size = "md", className, leadingIcon, trailingIcon, ...props },
  ref,
) {
  return (
    <View
      className={cn(
        "min-h-14 flex-row items-center gap-2 rounded-xl",
        variant === "default" && "border border-input bg-background",
        className,
      )}
    >
      {leadingIcon}
      <NativeInput
        ref={ref}
        className="flex-1"
        textStyle={{ fontSize: size === "lg" ? 18 : 16 }}
        {...props}
      />
      {trailingIcon}
    </View>
  );
});
