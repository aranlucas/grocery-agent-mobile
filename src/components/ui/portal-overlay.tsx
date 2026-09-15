import type { ReactNode } from "react";
import { Modal, Platform, View } from "react-native";

/** Give Android portal overlays native focus isolation and predictive Back dismissal. */
export function PortalOverlay({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (Platform.OS !== "android") return children;
  return (
    <Modal
      visible={open}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1" accessibilityViewIsModal>
        {children}
      </View>
    </Modal>
  );
}
