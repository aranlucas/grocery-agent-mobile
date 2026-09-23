import { usePreventRemove } from "expo-router/react-navigation";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { Alert, BackHandler } from "react-native";

export function useUnsavedChanges(dirty: boolean, onDiscard: () => void) {
  const router = useRouter();
  const confirmDiscard = useCallback(
    (leave: () => void) => {
      Alert.alert("Discard unsaved changes?", "Your last saved version will be kept.", [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard changes",
          style: "destructive",
          onPress: () => {
            onDiscard();
            leave();
          },
        },
      ]);
    },
    [onDiscard],
  );
  const disablePrevention = usePreventRemove(dirty, ({ repeat }) => confirmDiscard(repeat));
  // A hardware Back can exit the Android activity without removing a route,
  // particularly when an editor was opened from a deep link.
  useFocusEffect(
    useCallback(() => {
      if (!dirty) return;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        confirmDiscard(() => {
          disablePrevention();
          if (router.canGoBack()) router.back();
          else BackHandler.exitApp();
        });
        return true;
      });
      return () => subscription.remove();
    }, [confirmDiscard, disablePrevention, dirty, router]),
  );

  // A completed save may navigate before the form's reset has rendered.
  return disablePrevention;
}
