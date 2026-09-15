// Native modules are replaced at their public boundary. Emulator QA covers rendering,
// semantics, keyboard focus, and native sheet dismissal using the real Expo UI views.
import React, { useImperativeHandle, useMemo, useRef, useState } from "react";
import { Modal, Pressable, Text as RNText, TextInput as RNTextInput, View } from "react-native";

type Props = Record<string, any>;
function accessibility(modifiers: Props[] = []) {
  const semantics = modifiers.find((modifier) => modifier.$type === "semantics") ?? {};
  return {
    accessibilityLabel: semantics.contentDescription,
    accessibilityHint: semantics.stateDescription,
    "aria-invalid": Boolean(semantics.error),
    accessibilityState: { selected: semantics.selected, checked: semantics.checked },
  };
}
export const Host = ({ children, ...props }: Props) => <View {...props}>{children}</View>;
export const RNHostView = Host;
export const Row = Host;
export const Column = Host;
export const Text = ({ textStyle, ...props }: Props) => <RNText style={textStyle} {...props} />;
export function useNativeState(initial: string) {
  const current = useRef(initial);
  const [, render] = useState(0);
  return useMemo(
    () => ({
      get value() {
        return current.current;
      },
      set value(value: string) {
        current.current = value;
        render((version) => version + 1);
      },
    }),
    [],
  );
}
export const TextInput = React.forwardRef<RNTextInput, Props>(function TextInput(
  { value, modifiers, onFocus, onBlur, onChangeText, ...props },
  ref,
) {
  return (
    <RNTextInput
      {...props}
      {...accessibility(modifiers)}
      ref={ref}
      value={value?.value}
      onChangeText={(next) => {
        value.value = next;
        onChangeText?.(next);
      }}
      onFocus={() => onFocus?.()}
      onBlur={() => onBlur?.()}
    />
  );
});
export function Checkbox({ value, onValueChange, disabled, modifiers, ...props }: Props) {
  return (
    <Pressable
      {...props}
      {...accessibility(modifiers)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
    />
  );
}
export function Switch({ value, onValueChange, disabled, modifiers, ...props }: Props) {
  return (
    <Pressable
      {...props}
      {...accessibility(modifiers)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
    />
  );
}
export function Slider({ value, min, max, modifiers, ...props }: Props) {
  return (
    <View
      {...props}
      {...accessibility(modifiers)}
      accessibilityRole="adjustable"
      accessibilityValue={{ now: value, min, max }}
    />
  );
}
export function BottomSheet({ isPresented, onDismiss, children }: Props) {
  return (
    <Modal visible={isPresented} onRequestClose={onDismiss}>
      <View accessibilityViewIsModal>{children}</View>
    </Modal>
  );
}
export function CommunityBottomSheet({ index, onClose, children }: Props) {
  return (
    <BottomSheet isPresented={index >= 0} onDismiss={onClose}>
      {children}
    </BottomSheet>
  );
}
export function CommunityBottomSheetModal({ ref, onClose, children }: Props) {
  const [open, setOpen] = useState(false);
  const shown = useRef(false);
  const dismiss = () => {
    if (!shown.current) return;
    shown.current = false;
    setOpen(false);
    onClose?.();
  };
  useImperativeHandle(ref, () => ({
    present: () => {
      shown.current = true;
      setOpen(true);
    },
    dismiss,
  }));
  return (
    <BottomSheet isPresented={open} onDismiss={dismiss}>
      {children}
    </BottomSheet>
  );
}
export function Collapsible({ isOpen, onOpenChange, label, children }: Props) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: isOpen }}
        onPress={() => onOpenChange(!isOpen)}
      >
        <RNText>{label}</RNText>
      </Pressable>
      {isOpen ? children : null}
    </View>
  );
}
export function NativeButton({ children, onPress, disabled, ...props }: Props) {
  return (
    <Pressable
      {...props}
      accessibilityRole={props.accessibilityRole ?? "button"}
      accessibilityState={{ ...props.accessibilityState, disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}
export const CircularProgressIndicator = () => <View accessibilityRole="progressbar" />;
export const LinearProgressIndicator = ({ progress }: Props) => (
  <View accessibilityRole="progressbar" accessibilityValue={{ now: progress }} />
);
export const HorizontalDivider = View;
export const VerticalDivider = View;
