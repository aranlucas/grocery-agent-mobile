import React from "react";
import { View, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, CheckCheck } from "lucide-react-native";
import { useThemeColors } from "@/components/ui/theme-provider";
import { cn } from "@/lib/utils";

const bubbleVariants = cva("max-w-4/5 rounded-2xl px-4 py-2.5", {
  variants: {
    variant: {
      sent: "bg-primary self-end rounded-br-sm",
      received: "bg-secondary self-start rounded-bl-sm",
    },
  },
  defaultVariants: { variant: "received" },
});

const textVariants = cva("text-base", {
  variants: {
    variant: {
      sent: "text-primary-foreground",
      received: "text-secondary-foreground",
    },
  },
  defaultVariants: { variant: "received" },
});

export interface ChatBubbleProps
  extends React.ComponentPropsWithoutRef<typeof View>, VariantProps<typeof bubbleVariants> {
  className?: string;
  children: React.ReactNode;
  timestamp?: string;
  status?: "sent" | "delivered" | "read";
}

export function ChatBubble({
  variant,
  className,
  children,
  timestamp,
  status,
  ...props
}: ChatBubbleProps) {
  const isSent = variant === "sent";
  const colors = useThemeColors();
  const tick = `${colors.primaryForeground}99`;

  return (
    <View className={cn(bubbleVariants({ variant }), className)} {...props}>
      <Text className={textVariants({ variant })}>{children}</Text>
      {(timestamp || status) && (
        <View
          className={cn("mt-1 flex-row items-center gap-1", isSent ? "self-end" : "self-start")}
        >
          {timestamp && (
            <Text
              className={cn(
                "text-xs",
                isSent ? "text-primary-foreground/60" : "text-muted-foreground",
              )}
            >
              {timestamp}
            </Text>
          )}
          {status &&
            isSent &&
            (status === "sent" ? (
              <Check size={12} color={tick} />
            ) : (
              <CheckCheck size={12} color={status === "read" ? "#93c5fd" : tick} />
            ))}
        </View>
      )}
    </View>
  );
}
