import React from "react";
import { Text } from "react-native";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof Text> {
  className?: string;
}

export function Label({ className, ...props }: LabelProps) {
  return (
    <Text
      className={cn("text-foreground mb-2 text-sm leading-none font-medium", className)}
      {...props}
    />
  );
}
