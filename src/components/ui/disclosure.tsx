import { Collapsible, RNHostView } from "@expo/ui";
import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { UIHost } from "@/components/ui/native-host";
import { useThemeColor } from "@/hooks/use-theme-color";
export interface DisclosureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  children: ReactNode;
  className?: string;
}
export function Disclosure({ open, onOpenChange, label, children, className }: DisclosureProps) {
  const [width, setWidth] = useState(0);
  const color = useThemeColor("--color-muted-foreground", "#667067");
  return (
    <UIHost
      matchContents={{ vertical: true }}
      className={className}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <Collapsible
        isOpen={open}
        onOpenChange={onOpenChange}
        label={label}
        labelStyle={{ fontSize: 14, color }}
      >
        <RNHostView matchContents>
          <View style={{ width: Math.max(0, width - 32) }}>{children}</View>
        </RNHostView>
      </Collapsible>
    </UIHost>
  );
}
