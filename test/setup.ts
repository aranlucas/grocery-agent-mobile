import { afterEach, vi } from "vitest";
import { resetAllMocks } from "vitest-native/helpers";

vi.mock("uniwind", async (importOriginal) => ({
  ...(await importOriginal<typeof import("uniwind")>()),
  useCSSVariable: () => undefined,
}));

vi.mock("@expo/ui", () => import("./mocks/expo-ui"));
vi.mock("@expo/ui/jetpack-compose", () => import("./mocks/expo-ui"));
vi.mock("@expo/ui/community/bottom-sheet", async () => ({
  BottomSheet: (await import("./mocks/expo-ui")).CommunityBottomSheet,
  BottomSheetModal: (await import("./mocks/expo-ui")).CommunityBottomSheetModal,
}));
vi.mock("@/components/ui/native-button", async () => ({
  NativeButton: (await import("./mocks/expo-ui")).NativeButton,
}));

process.env.EXPO_OS = "android";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  resetAllMocks();
});
