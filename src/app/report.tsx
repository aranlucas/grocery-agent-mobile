import { Stack, useRouter } from "expo-router";
import Close from "@expo/material-symbols/close.xml";
import { X } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import { HeaderActionButton } from "@/components/header-action-button";
import { getLegalLinks } from "@/lib/config";
import { useAuth } from "@clerk/expo";
import { Linking, View } from "react-native";
import { useWatch } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FormField, FormTextarea } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useSubmitForm } from "@/hooks/use-submit-form";
import { buildReportMailto, type ReportCategory } from "@/lib/report";

const CATEGORIES: ReportCategory[] = ["Wrong item", "Connection issue", "App problem", "Other"];
type ReportFormValues = { category: ReportCategory; details: string };

export default function ReportScreen() {
  const router = useRouter();
  const close = () => (router.canGoBack() ? router.back() : router.replace("/account"));
  const { userId } = useAuth();
  const {
    clearErrors,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useSubmitForm<ReportFormValues>({
    defaultValues: { category: "Wrong item", details: "" },
  });
  const details = useWatch({ control, name: "details" });

  const submit = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      const url = buildReportMailto({ ...values, userId });
      if (!(await Linking.canOpenURL(url))) throw new Error("Email is unavailable");
      await Linking.openURL(url);
    } catch {
      setError("root.server", {
        message: "No email app is available. Visit Support from Account to contact us instead.",
      });
    }
  });

  return (
    <>
      <Screen>
        <View className="gap-2">
          <Text selectable variant="h3">
            Tell us what went wrong.
          </Text>
          <Text className="text-muted-foreground" selectable>
            We’ll open your email app with a report you can review before sending.
          </Text>
        </View>

        <Label>What happened?</Label>
        <FormField
          control={control}
          name="category"
          render={({ field }) => (
            <View
              accessibilityLabel="What happened?"
              accessibilityRole="radiogroup"
              className="flex-row flex-wrap gap-2"
            >
              {CATEGORIES.map((item) => {
                const selected = item === field.value;
                return (
                  <Chip
                    key={item}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    selected={selected}
                    onPress={() => field.onChange(item)}
                  >
                    {item}
                  </Chip>
                );
              })}
            </View>
          )}
        />

        <View className="gap-1">
          <FormTextarea
            className="min-h-40"
            control={control}
            label="Details"
            maxLength={3000}
            name="details"
            rules={{
              validate: (value) =>
                value.trim().length >= 10 ||
                "Add a few details so we can help (at least 10 characters).",
            }}
            placeholder="What did you expect, and what happened instead?"
          />
          <Text className="text-right tabular-nums" variant="muted">
            {details.length}/3000
          </Text>
        </View>

        <Alert title="Protect your privacy">
          <AlertDescription selectable>
            Do not include passwords, payment details, health information, or other sensitive data.
          </AlertDescription>
        </Alert>
        {errors.root?.server?.message ? (
          <View className="gap-2">
            <Alert title={errors.root.server.message} variant="destructive" />
            <Button
              variant="outline"
              onPress={() =>
                void WebBrowser.openBrowserAsync(getLegalLinks().support).catch(() =>
                  setError("root.server", {
                    message: "Support could not be opened. Check your connection and try again.",
                  }),
                )
              }
            >
              Open support
            </Button>
          </View>
        ) : null}
        <Button loading={isSubmitting} size="lg" variant="secondary" onPress={() => void submit()}>
          Review email report
        </Button>
      </Screen>
      {process.env.EXPO_OS === "web" ? (
        <Stack.Screen
          options={{
            headerRight: () => (
              <HeaderActionButton accessibilityLabel="Close report" icon={X} onPress={close} />
            ),
          }}
        />
      ) : (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            accessibilityLabel="Close report"
            icon={process.env.EXPO_OS === "android" ? Close : "xmark"}
            onPress={close}
          />
        </Stack.Toolbar>
      )}
    </>
  );
}
