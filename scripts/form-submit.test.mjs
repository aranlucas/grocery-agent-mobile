import assert from "node:assert/strict";
import { test } from "node:test";
import { createFormControl } from "react-hook-form";
import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { createSingleSubmit } from "../src/lib/form-submit.ts";

function deferred() {
  return Promise.withResolvers();
}

function formWithName(name = "Milk") {
  const form = createFormControl({ defaultValues: { name } });
  form.register("name", { validate: (value) => Boolean(value.trim()) });
  return { form, handleSubmit: createSingleSubmit(form.handleSubmit) };
}

await test("keyboard and button submissions in one render produce one mutation", async () => {
  const { form, handleSubmit } = formWithName();
  const request = deferred();
  const started = deferred();
  const client = new QueryClient();
  let calls = 0;
  let submitting = false;
  const unsubscribe = form.subscribe({
    formState: { isSubmitting: true },
    callback: (state) => {
      submitting = state.isSubmitting;
    },
  });
  const mutation = new MutationObserver(client, {
    mutationFn: async () => {
      calls++;
      started.resolve();
      await request.promise;
    },
  });
  const submit = handleSubmit(({ name }) => mutation.mutate(name));
  const first = submit();
  const second = submit();
  await started.promise;
  await second;
  assert.equal(calls, 1);
  assert.equal(submitting, true);
  request.resolve();
  await first;
  assert.equal(submitting, false);
  unsubscribe();
  client.clear();
});

await test("the gate stays closed during asynchronous validation", async () => {
  const validation = deferred();
  let validations = 0;
  let calls = 0;
  const form = createFormControl({
    defaultValues: { name: "Milk" },
    resolver: async (values) => {
      validations++;
      await validation.promise;
      return { values, errors: {} };
    },
  });
  const submit = createSingleSubmit(form.handleSubmit)(() => {
    calls++;
  });
  const first = submit();
  await submit();
  assert.equal(validations, 1);
  assert.equal(calls, 0);
  validation.resolve();
  await first;
  assert.equal(calls, 1);
});

await test("invalid input can be corrected and resubmitted", async () => {
  const { form, handleSubmit } = formWithName(" ");
  let calls = 0;
  let invalid = 0;
  const submit = handleSubmit(
    () => {
      calls++;
    },
    () => {
      invalid++;
    },
  );
  await submit();
  assert.equal(calls, 0);
  assert.equal(invalid, 1);
  form.setValue("name", "Milk");
  await submit();
  assert.equal(calls, 1);
});

await test("failed requests release the gate and preserve input for retry", async () => {
  const { form, handleSubmit } = formWithName();
  let attempts = 0;
  const submit = handleSubmit(async () => {
    if (++attempts === 1) throw new Error("Offline");
  });
  await assert.rejects(submit, /Offline/);
  assert.equal(form.getValues("name"), "Milk");
  await submit();
  assert.equal(attempts, 2);
});

await test("new render callbacks share the gate and use the latest callback after completion", async () => {
  const { handleSubmit } = formWithName();
  const request = deferred();
  const started = deferred();
  let nextCalls = 0;
  const first = handleSubmit(async () => {
    started.resolve();
    await request.promise;
  })();
  await started.promise;
  const nextSubmit = handleSubmit(() => {
    nextCalls++;
  });
  await nextSubmit();
  assert.equal(nextCalls, 0);
  request.resolve();
  await first;
  await nextSubmit();
  assert.equal(nextCalls, 1);
});

await test("resetting fields during a request does not reopen the gate", async () => {
  const { form, handleSubmit } = formWithName();
  const request = deferred();
  const started = deferred();
  let calls = 0;
  const submit = handleSubmit(async () => {
    calls++;
    form.reset({ name: "Bread" });
    started.resolve();
    await request.promise;
  });
  const first = submit();
  await started.promise;
  await submit();
  assert.equal(calls, 1);
  request.resolve();
  await first;
});

await test("separate forms can submit independently", async () => {
  const firstForm = formWithName();
  const secondForm = formWithName();
  const request = deferred();
  let secondCalls = 0;
  const first = firstForm.handleSubmit(() => request.promise)();
  await secondForm.handleSubmit(() => {
    secondCalls++;
  })();
  assert.equal(secondCalls, 1);
  request.resolve();
  await first;
});
