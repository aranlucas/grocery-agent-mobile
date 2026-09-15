import React, { forwardRef } from "react";
import { View, Text } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useThemeColor } from "@/hooks/use-theme-color";

export interface ActionSheetAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export interface ActionSheetProps {
  className?: string;
  title?: string;
  actions: ActionSheetAction[];
  onCancel?: () => void;
}

export const ActionSheet = forwardRef<BottomSheetModal, ActionSheetProps>(
  ({ className, title, actions, onCancel }, ref) => {
    const background = useThemeColor("--color-card", "#ffffff");

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: background }}
      >
        <BottomSheetView>
          <View className={cn("px-4 pb-8", className)}>
            {title && (
              <Text className="py-3 text-center text-sm text-muted-foreground">{title}</Text>
            )}
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.destructive ? "destructive" : "ghost"}
                onPress={action.onPress}
              >
                {action.label}
              </Button>
            ))}
            {onCancel ? (
              <Button variant="outline" onPress={onCancel}>
                Cancel
              </Button>
            ) : null}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

ActionSheet.displayName = "ActionSheet";
