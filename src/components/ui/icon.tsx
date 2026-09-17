import { cn } from "@/lib/utils";
import type { LucideIcon, LucideProps } from "lucide-react-native";
import * as React from "react";
import { useResolveClassNames } from "uniwind";

type IconProps = LucideProps & {
  as: LucideIcon;
} & React.RefAttributes<LucideIcon>;

/**
 * Lucide icon wrapper with Uniwind `className` support.
 *
 * @example
 * ```tsx
 * import { ArrowRight } from "lucide-react-native";
 * import { Icon } from "@/components/ui/icon";
 *
 * <Icon as={ArrowRight} className="text-primary" size={16} />
 * ```
 */
function Icon({ as: IconComponent, className, size, ...props }: IconProps) {
  const styles = useResolveClassNames(cn("text-foreground", className));
  const classSize = typeof styles.width === "number" ? styles.width : undefined;

  return (
    <IconComponent
      color={styles.color as LucideProps["color"]}
      size={size ?? classSize ?? 14}
      {...props}
    />
  );
}

export { Icon };
