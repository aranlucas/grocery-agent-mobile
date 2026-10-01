import { usePreventRemove } from "expo-router/react-navigation";
import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, BackHandler } from "react-native";

export function useUnsavedChanges(dirty: boolean, onDiscard: () => void) {
  const navigation = useNavigation();
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const allowNavigation = useCallback((leave: () => void) => setPendingLeave(() => leave), []);
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
  usePreventRemove(dirty && !pendingLeave, ({ data }) =>
    confirmDiscard(() => navigation.dispatch(data.action)),
  );
  // SDK 57 removes prevention after rendering. Navigate after that effect runs.
  useEffect(() => {
    if (!pendingLeave) return;
    pendingLeave();
  }, [pendingLeave]);
  // A hardware Back can exit the Android activity without removing a route,
  // particularly when an editor was opened from a deep link.
  useFocusEffect(
    useCallback(() => {
      if (!dirty) return;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        confirmDiscard(() =>
          allowNavigation(() => {
            if (navigation.canGoBack()) navigation.goBack();
            else BackHandler.exitApp();
          }),
        );
        return true;
      });
      return () => subscription.remove();
    }, [allowNavigation, confirmDiscard, dirty, navigation]),
  );

  // A completed save may navigate before the form's reset has rendered.
  return allowNavigation;
}
