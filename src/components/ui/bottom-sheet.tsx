import React, { forwardRef } from "react";
import { View } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { cn } from "@/lib/utils";
import { useThemeColor } from "@/hooks/use-theme-color";

export interface BottomSheetProps {
  className?: string;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
}

export const BottomSheet = forwardRef<BottomSheetModal, BottomSheetProps>(
  ({ className, children, snapPoints = ["25%", "50%"], ...props }, ref) => {
    const background = useThemeColor("--color-card", "#ffffff");

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: background }}
        {...props}
      >
        <BottomSheetView>
          <View className={cn("p-4", className)}>{children}</View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

BottomSheet.displayName = "BottomSheet";
