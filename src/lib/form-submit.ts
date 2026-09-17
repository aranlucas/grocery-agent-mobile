import type { FieldValues, UseFormHandleSubmit } from "react-hook-form";

/** Share one submission gate across all handlers belonging to a form. */
export function createSingleSubmit<T extends FieldValues>(
  handleSubmit: UseFormHandleSubmit<T>,
): UseFormHandleSubmit<T> {
  let submitting = false;

  return (onValid, onInvalid) => async (event) => {
    event?.preventDefault();
    // RHF's isSubmitting drives rendering, but does not serialize handleSubmit calls.
    // Acquire before validation so keyboard and button events in the same render dedupe.
    if (submitting) return;
    submitting = true;
    try {
      await handleSubmit(onValid, onInvalid)(event);
    } finally {
      submitting = false;
    }
  };
}
