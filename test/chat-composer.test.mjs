import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "vitest";

// Evaluate the actual composer with a controlled form boundary, as the unsaved
// navigation tests do. UI hosts are inert; the asynchronous submission runs.
function composer(initialMessage, onSend) {
  const file = readFileSync(new URL("../src/components/grocery-chat.tsx", import.meta.url), "utf8");
  const start = file.indexOf("const ChatComposer =");
  const end = file.indexOf("\nfunction formatReasoningDuration", start);
  let value = initialMessage;
  let submit;
  const source = ts.transpileModule(
    file.slice(start, end) + "\nglobalThis.Composer = ChatComposer;",
    {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
    },
  ).outputText;
  const context = {
    exports: {},
    memo: (component) => component,
    require: () => ({ jsx: () => null, jsxs: () => null }),
    FormField: () => null,
    Keyboard: { dismiss() {} },
    useSubmitForm: () => ({
      control: {},
      formState: { isSubmitting: false },
      getValues: () => value,
      reset: (values = { message: initialMessage }) => {
        value = values.message;
      },
      handleSubmit: (callback) => {
        submit = () => callback({ message: value });
        return submit;
      },
    }),
  };
  runInNewContext(source, context);
  context.Composer({ initialMessage, isRunning: false, onSend, onStop: async () => {} });
  return {
    send: () => submit(),
    type: (text) => {
      value = text;
    },
    get value() {
      return value;
    },
  };
}

test("sending a route prompt clears the composer instead of repeating it", async () => {
  const form = composer("Plan this recipe", async () => ({ status: "success" }));
  await form.send();
  expect(form.value).toBe("");
});

test.each(["", "My next message"])(
  "failed send preserves newer draft %j or restores failed input",
  async (draft) => {
    const result = Promise.withResolvers();
    const form = composer("Failed message", () => result.promise);
    const sending = form.send();
    form.type(draft);
    result.resolve({ status: "failed" });
    await sending;
    expect(form.value).toBe(draft || "Failed message");
  },
);
