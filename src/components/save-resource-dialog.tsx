import { useEffect } from "react";
import { View } from "react-native";
import { useWatch } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert } from "@/components/ui/alert";
import { Chip } from "@/components/ui/chip";
import { FormInput } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { useSubmitForm } from "@/hooks/use-submit-form";
import type { Household } from "@/lib/household-api";

export function SaveResourceDialog({
  defaultTitle,
  error,
  households,
  kind,
  onConfirm,
  onOpenChange,
  open,
}: {
  defaultTitle: string;
  error?: string;
  households: Household[];
  kind: "list" | "recipe";
  onConfirm: (title: string, householdId?: string) => Promise<unknown>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useSubmitForm<{
    title: string;
    householdId?: string;
  }>({ defaultValues: { title: defaultTitle, householdId: undefined } });
  const householdId = useWatch({ control, name: "householdId" });

  useEffect(() => {
    if (!open) return;
    reset({ title: defaultTitle, householdId: undefined });
  }, [defaultTitle, open, reset]);

  const resource = kind === "list" ? "grocery list" : "recipe";
  const submit = handleSubmit(async ({ title, householdId }) => {
    try {
      await onConfirm(title.trim(), householdId);
    } catch {
      // The caller's mutation error is rendered below; preserve the draft for retry.
    }
  });
  return (
    <AlertDialog busy={isSubmitting} onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save {resource}</AlertDialogTitle>
          <AlertDialogDescription>
            Keep it personal or make it available to everyone in one of your households.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <View className="gap-3">
          <FormInput
            accessibilityLabel={`${kind === "list" ? "List" : "Recipe"} title`}
            autoCapitalize="sentences"
            control={control}
            label={kind === "list" ? "List title" : "Recipe title"}
            disabled={isSubmitting}
            name="title"
            placeholder={kind === "list" ? "Weekly groceries" : "Recipe title"}
            rules={{
              validate: (value) => value.trim().length > 0 || "Add a title.",
            }}
          />
          <View className="gap-2">
            <Text className="font-semibold" variant="small">
              Save to
            </Text>
            <View
              accessibilityLabel="Save to"
              accessibilityRole="radiogroup"
              className="flex-row flex-wrap gap-2"
            >
              <Chip
                disabled={isSubmitting}
                accessibilityRole="radio"
                accessibilityState={{ checked: !householdId }}
                onPress={() => setValue("householdId", undefined)}
                selected={!householdId}
              >
                Personal
              </Chip>
              {households.map((household) => (
                <Chip
                  key={household.id}
                  disabled={isSubmitting}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: householdId === household.id }}
                  onPress={() => setValue("householdId", household.id)}
                  selected={householdId === household.id}
                >
                  {household.name}
                </Chip>
              ))}
            </View>
          </View>
          {error ? <Alert title={error} variant="destructive" /> : null}
        </View>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} onPress={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            testID="save-resource-submit"
            loading={isSubmitting}
            onPress={() => void submit()}
          >
            {isSubmitting ? "Saving…" : "Save"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
