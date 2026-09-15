import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DropdownMenuPrimitive from "@rn-primitives/dropdown-menu";
import Animated from "react-native-reanimated";
import { entering, exiting } from "@/components/ui/animate";
import { cn } from "@/lib/utils";
import { PortalOverlay } from "./portal-overlay";

export interface DropdownMenuProps {
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, onOpenChange }: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root onOpenChange={onOpenChange}>{children}</DropdownMenuPrimitive.Root>
  );
}

export function DropdownMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Pressable> & {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuPrimitive.Trigger asChild>
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
    </DropdownMenuPrimitive.Trigger>
  );
}

export interface DropdownMenuContentProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  children?: React.ReactNode;
  side?: "top" | "bottom";
  sideOffset?: number;
  align?: "start" | "center" | "end";
}

export function DropdownMenuContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  ...props
}: DropdownMenuContentProps) {
  const insets = useSafeAreaInsets();
  const { open, onOpenChange } = DropdownMenuPrimitive.useRootContext();
  return (
    <DropdownMenuPrimitive.Portal>
      <PortalOverlay open={open} onClose={() => onOpenChange(false)}>
        <DropdownMenuPrimitive.Overlay className="absolute inset-0" />
        <DropdownMenuPrimitive.Content
          side={side}
          sideOffset={sideOffset}
          align={align}
          avoidCollisions
          insets={insets}
        >
          <Animated.View entering={entering.fadeIn} exiting={exiting.fadeOut}>
            <View
              className={cn(
                "min-w-52 rounded-lg border border-border bg-card p-1 shadow-lg",
                className,
              )}
              {...props}
            >
              {children}
            </View>
          </Animated.View>
        </DropdownMenuPrimitive.Content>
      </PortalOverlay>
    </DropdownMenuPrimitive.Portal>
  );
}

export interface DropdownMenuItemProps extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  children: React.ReactNode;
  destructive?: boolean;
}

export function DropdownMenuItem({
  className,
  children,
  destructive,
  ...props
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item asChild>
      <Pressable
        className={cn("flex-row items-center rounded-md px-3 py-2.5 min-h-14", className)}
        accessible={true}
        accessibilityRole="menuitem"
        {...props}
      >
        {typeof children === "string" ? (
          <Text className={cn("text-sm", destructive ? "text-destructive" : "text-foreground")}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    </DropdownMenuPrimitive.Item>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <DropdownMenuPrimitive.Separator className={cn("my-1 h-px bg-border", className)} />;
}
