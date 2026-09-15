/** Native control fixture. Temporarily load from index.js for emulator QA; never imported by production. */
import "../src/global.css";
import { registerRootComponent } from "expo";
import { useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { SafeArea } from "@/components/ui/safe-area";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { FormInput, FormTextarea } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { SaveResourceDialog } from "@/components/save-resource-dialog";
import { Disclosure } from "@/components/ui/disclosure";

function Preview() {
  const form = useForm({ defaultValues: { name: "", notes: "" } });
  const [checked, setChecked] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [store, setStore] = useState("kroger");
  const [amount, setAmount] = useState(25);
  const [status, setStatus] = useState("Ready");
  const [expanded, setExpanded] = useState(false);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <SafeArea>
            <StatusBar style="auto" />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
              contentContainerClassName="gap-4 p-4 sm:p-6"
            >
              <Text className="text-2xl text-foreground">Expo UI native verification</Text>
              <FormInput
                control={form.control}
                name="name"
                label="List name"
                rules={{ required: "Enter a list name" }}
                placeholder="Weekly groceries"
              />
              <FormTextarea
                control={form.control}
                name="notes"
                label="Notes"
                placeholder="Add notes"
              />
              <View className="flex-row gap-2">
                <Button
                  className="flex-1"
                  onPress={() =>
                    void form.handleSubmit((values) => setStatus(`Saved ${values.name}`))()
                  }
                >
                  Save list
                </Button>
                <Button
                  variant="outline"
                  onPress={() => {
                    form.reset();
                    setStatus("Reset");
                  }}
                >
                  Reset
                </Button>
              </View>
              <Text accessibilityLiveRegion="polite" className="text-foreground">
                {status}
              </Text>
              <View className="flex-row items-center">
                <Checkbox
                  checked={checked}
                  onCheckedChange={setChecked}
                  accessibilityLabel="Milk purchased"
                />
                <Text className="text-foreground">Milk purchased</Text>
              </View>
              <Chip selected={checked} onPress={() => setChecked(!checked)}>
                Vegetarian
              </Chip>
              <Select
                label="Store"
                value={store}
                onValueChange={setStore}
                options={[
                  { label: "Kroger", value: "kroger" },
                  { label: "QFC", value: "qfc" },
                ]}
              />
              <Switch
                value={checked}
                onValueChange={setChecked}
                accessibilityLabel="Notifications"
              />
              <Slider value={amount} onValueChange={setAmount} accessibilityLabel="Budget" />
              <Button onPress={() => setSheet(true)}>Open save sheet</Button>
              <Disclosure open={expanded} onOpenChange={setExpanded} label="Shopping details">
                <Text className="text-foreground">
                  A longer explanation of your grocery choices wraps within the screen and stays
                  readable when you expand this section.
                </Text>
              </Disclosure>
              <Button disabled>Disabled action</Button>
              <Button variant="destructive" onPress={() => setStatus("Deleted")}>
                Delete
              </Button>
              <SaveResourceDialog
                open={sheet}
                onOpenChange={setSheet}
                defaultTitle="Weekend groceries"
                households={[]}
                kind="list"
                saving={false}
                onConfirm={(title) => {
                  setStatus("Saved " + title);
                  setSheet(false);
                }}
              />
            </ScrollView>
          </SafeArea>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
registerRootComponent(Preview);
