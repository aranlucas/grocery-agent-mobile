import React from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as PopoverPrimitive from "@rn-primitives/popover";
import Animated from "react-native-reanimated";
import { entering, exiting } from "@/components/ui/animate";
import { cn } from "@/lib/utils";
import { PortalOverlay } from "./portal-overlay";

export interface PopoverProps {
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Popover({ onOpenChange, children }: PopoverProps) {
  return <PopoverPrimitive.Root onOpenChange={onOpenChange}>{children}</PopoverPrimitive.Root>;
}

export interface PopoverTriggerProps extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  children?: React.ReactNode;
}

export function PopoverTrigger({ className, children, ...props }: PopoverTriggerProps) {
  return (
    <PopoverPrimitive.Trigger asChild>
      {/* Keep the inline anchor measurable; expand its touch area without shifting the overlay. */}
      <Pressable
        hitSlop={16}
        className={cn("", className)}
        accessible={true}
        accessibilityRole="button"
        {...props}
      >
        {children}
      </Pressable>
    </PopoverPrimitive.Trigger>
  );
}

export interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  children?: React.ReactNode;
  side?: "top" | "bottom";
  sideOffset?: number;
  align?: "start" | "center" | "end";
}

export function PopoverContent({
  className,
  children,
  side = "bottom",
  sideOffset = 8,
  align = "center",
  ...props
}: PopoverContentProps) {
  const insets = useSafeAreaInsets();
  const { open, onOpenChange } = PopoverPrimitive.useRootContext();
  return (
    <PopoverPrimitive.Portal>
      <PortalOverlay open={open} onClose={() => onOpenChange(false)}>
        <PopoverPrimitive.Overlay className="absolute inset-0" />
        <PopoverPrimitive.Content
          side={side}
          sideOffset={sideOffset}
          align={align}
          avoidCollisions
          insets={insets}
        >
          <Animated.View entering={entering.fadeIn} exiting={exiting.fadeOut}>
            <View
              className={cn(
                "w-72 rounded-lg border border-border bg-card p-4 shadow-lg",
                className,
              )}
              {...props}
            >
              {children}
            </View>
          </Animated.View>
        </PopoverPrimitive.Content>
      </PortalOverlay>
    </PopoverPrimitive.Portal>
  );
}

export function PopoverClose({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Pressable> & {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <PopoverPrimitive.Close asChild>
      <Pressable
        className={cn("", className)}
        accessible={true}
        accessibilityRole="button"
        {...props}
      >
        {children}
      </Pressable>
    </PopoverPrimitive.Close>
  );
}
