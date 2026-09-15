import React, { useEffect, useRef } from "react";
import { Keyboard, View, Text, ScrollView, useWindowDimensions } from "react-native";
import { BottomSheetModal } from "@expo/ui/community/bottom-sheet";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useThemeColor } from "@/hooks/use-theme-color";
import { cn } from "@/lib/utils";

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  const background = useThemeColor("--color-card", "#ffffff");
  const { height, width } = useWindowDimensions();
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    Keyboard.dismiss();
    if (open) sheet.current?.present();
    else sheet.current?.dismiss();
  }, [open]);
  return (
    <BottomSheetModal
      ref={sheet}
      onClose={() => {
        Keyboard.dismiss();
        onOpenChange(false);
      }}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: background }}
    >
      <ScrollView
        className="self-center"
        style={{ width: Math.min(width, 640), maxHeight: height * 0.8 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerClassName="items-center"
      >
        {children}
      </ScrollView>
    </BottomSheetModal>
  );
}

export function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <View
      accessibilityRole="alert"
      className={cn("w-full max-w-3xl bg-card p-4 sm:p-6", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function AlertDialogHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return <View className={cn("pb-4", className)} {...props} />;
}

export function AlertDialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text> & { className?: string }) {
  return (
    <Text className={cn("text-lg font-semibold text-card-foreground", className)} {...props} />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text> & { className?: string }) {
  return <Text className={cn("mt-1 text-sm text-muted-foreground", className)} {...props} />;
}

export function AlertDialogFooter({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  return (
    <View
      className={cn("flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function AlertDialogAction(props: ButtonProps) {
  return <Button {...props} />;
}

export function AlertDialogCancel(props: ButtonProps) {
  return <Button variant="outline" {...props} />;
}
