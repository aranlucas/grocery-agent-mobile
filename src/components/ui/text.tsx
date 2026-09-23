import React from "react";
import { Text as RNText } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textVariants = cva("text-foreground", {
  variants: {
    variant: {
      h1: "text-4xl leading-tight font-bold tracking-tight",
      h2: "text-3xl leading-tight font-bold tracking-tight",
      h3: "text-2xl leading-snug font-semibold tracking-tight",
      h4: "text-lg leading-snug font-semibold",
      p: "text-base leading-6",
      lead: "text-lg leading-7 text-muted-foreground",
      large: "text-base leading-6 font-semibold",
      small: "text-sm leading-5 font-medium",
      muted: "text-sm leading-5 text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "p",
  },
});

export interface TextProps
  extends React.ComponentPropsWithoutRef<typeof RNText>, VariantProps<typeof textVariants> {
  className?: string;
}

export function Text({ variant, className, ...props }: TextProps) {
  return (
    <RNText
      accessibilityRole={variant?.startsWith("h") ? "header" : undefined}
      className={cn(textVariants({ variant }), className)}
      {...props}
    />
  );
}
