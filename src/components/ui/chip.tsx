import { Button, type ButtonProps } from "@/components/ui/button";

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
  ...props
}: ChipProps) {
  return (
    <Button
      {...props}
      size={size}
      variant={selected ? "default" : (variant ?? "outline")}
      accessibilityState={{ ...accessibilityState, selected }}
    >
      {children}
    </Button>
  );
}
