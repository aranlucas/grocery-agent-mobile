import React, { createContext, useContext, useState } from "react";
import { View, useColorScheme } from "react-native";
import {
  NativeInput,
  type NativeInputProps,
  type NativeInputRef,
} from "@/components/ui/native-input";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ArrowUp, Square } from "lucide-react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { cn } from "@/lib/utils";

// Compound composer (ChatGPT/Claude-style): textarea on top, toolbar below.
// <PromptInput onSend={…}><PromptInputTextarea /><PromptInputToolbar>…</PromptInputToolbar></PromptInput>

type PromptInputCtx = {
  text: string;
  setText: (t: string) => void;
  send: () => void;
  streaming?: boolean;
  dark: boolean;
};
const Ctx = createContext<PromptInputCtx | null>(null);

export function usePromptInput(): PromptInputCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("PromptInput.* components must be used inside <PromptInput>");
  return ctx;
}

export interface PromptInputProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSend?: (text: string) => void;
  /** While `streaming`, PromptInputSend becomes a stop button firing this. */
  onStop?: () => void;
  streaming?: boolean;
  clearOnSend?: boolean;
}

export function PromptInput({
  className,
  value,
  onChangeText,
  onSend,
  onStop,
  streaming,
  clearOnSend = true,
  children,
  ...props
}: PromptInputProps) {
  const [internal, setInternal] = useState("");
  const dark = useColorScheme() === "dark";
  const text = value ?? internal;

  const setText = (t: string) => {
    if (value === undefined) setInternal(t);
    onChangeText?.(t);
  };
  const send = () => {
    if (streaming) return onStop?.();
    const t = text.trim();
    if (!t) return;
    onSend?.(t);
    if (clearOnSend && value === undefined) setInternal("");
  };

  return (
    <Ctx.Provider value={{ text, setText, send, streaming, dark }}>
      <View
        className={cn("rounded-3xl border border-input bg-background px-3 pt-3 pb-2", className)}
        {...props}
      >
        {children}
      </View>
    </Ctx.Provider>
  );
}

export interface PromptInputTextareaProps extends Omit<
  NativeInputProps,
  "multiline" | "value" | "onChangeText"
> {
  maxHeight?: number;
}

export const PromptInputTextarea = React.forwardRef<NativeInputRef, PromptInputTextareaProps>(
  function PromptInputTextarea({ className, maxHeight = 120, ...props }, ref) {
    const { text, setText } = usePromptInput();
    return (
      <NativeInput
        ref={ref}
        multiline
        style={{ padding: 0 }}
        value={text}
        onChangeText={setText}
        numberOfLines={Math.max(1, Math.min(3, Math.floor(maxHeight / 24)))}
        className={cn("w-full", className)}
        placeholder="How can I help you today?"
        accessibilityLabel="Message"
        {...props}
      />
    );
  },
);

export interface PromptInputToolbarProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
}

/** Bottom action row — put leading tools first, then <PromptInputSpacer />, then trailing tools. */
export function PromptInputToolbar({ className, ...props }: PromptInputToolbarProps) {
  return <View className={cn("flex-row items-center gap-1 pt-2", className)} {...props} />;
}

export function PromptInputSpacer() {
  return <View className="flex-1" />;
}

export type PromptInputButtonProps = ButtonProps;
export function PromptInputButton(props: PromptInputButtonProps) {
  return <Button variant="ghost" size="icon" {...props} />;
}

export interface PromptInputSendProps extends ButtonProps {
  emptyFallback?: React.ReactNode;
}
export function PromptInputSend({ className, emptyFallback, ...props }: PromptInputSendProps) {
  const { text, send, streaming } = usePromptInput();
  const canSend = text.trim().length > 0;
  const foreground = useThemeColor("--color-primary-foreground", "#ffffff");
  if (!canSend && !streaming && emptyFallback) return <>{emptyFallback}</>;
  return (
    <Button
      onPress={send}
      disabled={!canSend && !streaming}
      className={className}
      size="icon"
      accessibilityLabel={streaming ? "Stop generating" : "Send message"}
      icon={
        streaming ? (
          <Square size={14} color={foreground} fill={foreground} />
        ) : (
          <ArrowUp size={20} color={foreground} strokeWidth={2.5} />
        )
      }
      {...props}
    />
  );
}
