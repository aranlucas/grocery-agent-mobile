import React from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <View className={cn("items-center justify-center gap-3 px-4 py-10", className)} {...props}>
      {icon && (
        <View
          accessible={false}
          className="size-16 items-center justify-center rounded-2xl bg-primary-surface"
        >
          {icon}
        </View>
      )}
      <Text className="text-center" variant="h4">
        {title}
      </Text>
      {description && (
        <Text className="max-w-80 text-center" variant="muted">
          {description}
        </Text>
      )}
      {action && (
        <Button className="mt-2 w-full max-w-xs" onPress={action.onPress} size="lg">
          {action.label}
        </Button>
      )}
    </View>
  );
}
