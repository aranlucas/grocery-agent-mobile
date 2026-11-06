import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Button } from "@/components/ui/button";

export default function FixtureHome() {
  const router = useRouter();
  return (
    <Screen>
      <Button
        onPress={() => router.push({ pathname: "/saved-list", params: { listId: "fixture" } })}
      >
        Open fixture list
      </Button>
    </Screen>
  );
}
