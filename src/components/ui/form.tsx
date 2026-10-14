import React from "react";
import { View } from "react-native";
import {
  Controller,
  useController,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NativeInputProps } from "@/components/ui/native-input";
import { Text } from "@/components/ui/text";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return <Controller {...props} />;
}

function FormItem({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn("gap-1.5", className)} {...props} />;
}

function FormMessage({ className, message }: { className?: string; message?: string }) {
  if (!message) return null;
  return (
    <Text
      accessibilityRole="alert"
      className={cn("text-destructive", className)}
      selectable
      variant="small"
    >
      {message}
    </Text>
  );
}

type SharedFieldProps = {
  containerClassName?: string;
  description?: string;
  label?: string;
};

type OmittedControlProps =
  | "defaultValue"
  | "disabled"
  | "name"
  | "onBlur"
  | "onChange"
  | "onChangeText"
  | "value";

type FormTextControlProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TControlProps extends NativeInputProps,
> = UseControllerProps<TFieldValues, TName> &
  Omit<TControlProps, OmittedControlProps> &
  SharedFieldProps;

type FormTextField<TControlProps extends NativeInputProps> = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: FormTextControlProps<TFieldValues, TName, TControlProps>,
) => React.ReactElement;

function createFormTextControl<TControlProps extends NativeInputProps>(
  Control: typeof Input | typeof Textarea,
): FormTextField<TControlProps> {
  return function FormTextControl({
    className,
    containerClassName,
    control,
    defaultValue,
    description,
    disabled,
    label,
    name,
    rules,
    shouldUnregister,
    accessibilityHint,
    accessibilityLabel,
    accessibilityState,
    ...props
  }) {
    const labelId = React.useId();
    const { field, fieldState, formState } = useController({
      control,
      defaultValue,
      name,
      rules,
      shouldUnregister,
    });
    // Busy controls must keep their submitted values. RHF's `disabled` option
    // omits the field from the payload, so apply it only to the native input.
    const error = fieldState.error?.message;
    const showError = Boolean(error) && (fieldState.isTouched || formState.isSubmitted);

    return (
      <FormItem className={containerClassName}>
        {label ? (
          <Label className="mb-0" nativeID={labelId}>
            {label}
          </Label>
        ) : null}
        <Control
          ref={field.ref}
          {...props}
          accessibilityHint={showError ? error : accessibilityHint}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityLabelledBy={label ? labelId : undefined}
          accessibilityState={{
            ...accessibilityState,
            disabled: Boolean(disabled),
          }}
          aria-invalid={showError || undefined}
          className={cn(showError && "border-destructive", className)}
          editable={disabled ? false : props.editable}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          value={typeof field.value === "string" ? field.value : String(field.value ?? "")}
        />
        {showError ? (
          <FormMessage message={error} />
        ) : description ? (
          <Text className="text-muted-foreground" selectable variant="small">
            {description}
          </Text>
        ) : null}
      </FormItem>
    );
  };
}

export type FormInputProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormTextControlProps<TFieldValues, TName, InputProps>;

export type FormTextareaProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormTextControlProps<TFieldValues, TName, TextareaProps>;

export const FormInput = createFormTextControl<InputProps>(Input);
export const FormTextarea = createFormTextControl<TextareaProps>(Textarea);
