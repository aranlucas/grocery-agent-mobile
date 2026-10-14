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
  busy?: boolean;
}

export function AlertDialog({ open, onOpenChange, children, busy = false }: AlertDialogProps) {
  const background = useThemeColor("--color-card", "#ffffff");
  const { height, width } = useWindowDimensions();
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    if (open) {
      Keyboard.dismiss();
      sheet.current?.present();
    } else sheet.current?.dismiss();
  }, [open]);
  return (
    <BottomSheetModal
      ref={sheet}
      onClose={() => {
        Keyboard.dismiss();
        onOpenChange(false);
      }}
      enablePanDownToClose={!busy}
      backgroundStyle={{ backgroundColor: background }}
    >
      <ScrollView
        className="self-center"
        style={{ width: Math.min(width, 640), maxHeight: height * 0.8 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="items-center pb-6"
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
      accessibilityViewIsModal
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
    <Text
      accessibilityRole="header"
      className={cn("text-xl leading-7 font-semibold text-card-foreground", className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text> & { className?: string }) {
  return (
    <Text className={cn("mt-2 text-base leading-6 text-muted-foreground", className)} {...props} />
  );
}

export function AlertDialogFooter({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { className?: string }) {
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  return (
    <View
      className={cn("gap-3 pt-4", wide ? "flex-row" : "flex-col-reverse", className)}
      {...props}
    >
      {React.Children.map(children, (child) => (
        <View className={wide ? "flex-1" : "w-full"}>{child}</View>
      ))}
    </View>
  );
}

export function AlertDialogAction(props: ButtonProps) {
  return <Button {...props} />;
}

export function AlertDialogCancel(props: ButtonProps) {
  return <Button variant="outline" {...props} />;
}
