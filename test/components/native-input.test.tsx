import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, vi } from "vitest";
import { NativeInput } from "@/components/ui/native-input";

describe("NativeInput", () => {
  it("preserves newer native edits through delayed form echoes and still accepts external resets", async () => {
    const onChangeText = vi.fn();
    const field = (value: string) => (
      <NativeInput accessibilityLabel="Title" value={value} onChangeText={onChangeText} />
    );
    const view = await render(field(""));
    await fireEvent.changeText(screen.getByLabelText("Title"), "G");
    await fireEvent.changeText(screen.getByLabelText("Title"), "Groceries");

    await view.rerender(field("G"));
    expect(screen.getByDisplayValue("Groceries")).toBeTruthy();
    await view.rerender(field("Groceries"));
    expect(screen.getByDisplayValue("Groceries")).toBeTruthy();

    await view.rerender(field("Weekend"));
    expect(screen.getByDisplayValue("Weekend")).toBeTruthy();
    expect(onChangeText.mock.calls).toEqual([["G"], ["Groceries"]]);
  });
});
