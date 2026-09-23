import React from "react";
import { View, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CircleAlert, CircleCheck } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";

const alertVariants = cva("rounded-lg border p-4", {
  variants: {
    variant: {
      default: "border-border bg-background",
      destructive: "border-destructive/50 bg-destructive/10",
      success: "border-success/20 bg-success-surface",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const alertTitleVariants = cva("text-base font-semibold mb-1", {
  variants: {
    variant: {
      default: "text-foreground",
      destructive: "text-destructive",
      success: "text-success",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface AlertProps
  extends React.ComponentPropsWithoutRef<typeof View>, VariantProps<typeof alertVariants> {
  className?: string;
  title?: string;
  titleClassName?: string;
  children?: React.ReactNode;
}

export function Alert({
  variant,
  className,
  title,
  titleClassName,
  children,
  ...props
}: AlertProps) {
  return (
    <View
      className={cn(alertVariants({ variant }), className)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      {...props}
    >
      {title && (
        <View className="flex-row items-start gap-2">
          {variant === "success" || variant === "destructive" ? (
            <Icon
              as={variant === "success" ? CircleCheck : CircleAlert}
              className={cn(
                "mt-0.5 size-5",
                variant === "success" ? "text-success" : "text-destructive",
              )}
            />
          ) : null}
          <Text
            selectable
            className={cn("flex-1 leading-6", alertTitleVariants({ variant }), titleClassName)}
          >
            {title}
          </Text>
        </View>
      )}
      {children}
    </View>
  );
}

export interface AlertDescriptionProps extends React.ComponentPropsWithoutRef<typeof Text> {
  className?: string;
}

export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return <Text className={cn("text-sm leading-5 text-muted-foreground", className)} {...props} />;
}
