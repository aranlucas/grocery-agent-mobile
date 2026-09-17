import { useState } from "react";
import { useForm, type FieldValues, type UseFormProps } from "react-hook-form";
import { createSingleSubmit } from "@/lib/form-submit";

/** React Hook Form with duplicate submissions suppressed for the form's lifetime. */
export function useSubmitForm<T extends FieldValues>(props: UseFormProps<T>) {
  const form = useForm<T>(props);
  const [handleSubmit] = useState(() => createSingleSubmit(form.handleSubmit));
  return { ...form, handleSubmit };
}
