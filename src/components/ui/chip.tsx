import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChipProps extends Omit<ButtonProps, "variant" | "size"> {
  children: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
  size?: "sm" | "md" | "lg";
  selected?: boolean;
}

export function Chip({
  selected,
  children,
  variant,
  size,
  accessibilityState,
  className,
  ...props
}: ChipProps) {
  return (
    <Button
      {...props}
      className={cn("self-start", className)}
      size={size}
      variant={selected ? "default" : (variant ?? "outline")}
      accessibilityState={{ ...accessibilityState, selected }}
    >
      {children}
    </Button>
  );
}
