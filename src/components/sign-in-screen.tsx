import { useSignIn, useSignUp, useSSO } from "@clerk/expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { BackHandler, ScrollView, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { BrandMark } from "@/components/brand-mark";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form";
import { KeyboardView } from "@/components/ui/keyboard-view";
import { SafeArea } from "@/components/ui/safe-area";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useSubmitForm } from "@/hooks/use-submit-form";
import { readableError } from "@/lib/auth";

WebBrowser.maybeCompleteAuthSession();

type Mode = "sign-in" | "sign-up" | "verify" | "reset-request" | "reset-code" | "reset-password";
type AuthFormValues = { email: string; password: string; code: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function SignInScreen() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [codeBusy, setCodeBusy] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [destinationEmail, setDestinationEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [oauthBusy, setOauthBusy] = useState(false);
  const {
    clearErrors,
    control,
    getValues,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting, isValid },
  } = useSubmitForm<AuthFormValues>({
    defaultValues: { code: "", email: "", password: "" },
    mode: "onChange",
  });
  const busy = oauthBusy || isSubmitting || codeBusy;
  const verificationEmail = destinationEmail || getValues("email");
  const isCode = mode === "verify" || mode === "reset-code";
  const isCredentials = mode === "sign-in" || mode === "sign-up";
  const changeMode = (nextMode: Mode) => {
    reset({ code: "", email: getValues("email") || destinationEmail, password: "" });
    setPasswordVisible(false);
    setNotice("");
    setMode(nextMode);
  };
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (mode === "sign-in") return false;
      if (!busy) changeMode("sign-in");
      return true;
    });
    return () => subscription.remove();
  });
  useEffect(() => {
    if (!resendPending) return;
    const timeout = setTimeout(() => setResendPending(false), 30_000);
    return () => clearTimeout(timeout);
  }, [resendPending]);
  const resendCode = async () => {
    if (busy || resendPending) return;
    setCodeBusy(true);
    clearErrors("root");
    try {
      const result =
        mode === "verify"
          ? await signUp.verifications.sendEmailCode()
          : await signIn.resetPasswordEmailCode.sendCode();
      if (result.error) throw result.error;
      setNotice("A new code is on its way. Check your inbox and spam folder.");
      setResendPending(true);
    } catch (caught) {
      setError("root.server", { message: readableError(caught) });
    } finally {
      setCodeBusy(false);
    }
  };

  const authenticateWithGoogle = async () => {
    setOauthBusy(true);
    clearErrors("root");
    try {
      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: Linking.createURL("/"),
      });
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
      }
    } catch (caught) {
      setError("root.server", { message: readableError(caught) });
    } finally {
      setOauthBusy(false);
    }
  };

  const submitCredentials = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      if (mode === "reset-request") {
        const created = await signIn.create({ identifier: values.email.trim() });
        if (created.error) throw created.error;
        const sent = await signIn.resetPasswordEmailCode.sendCode();
        if (sent.error) throw sent.error;
        setResendPending(true);
        setDestinationEmail(values.email.trim());
        setMode("reset-code");
        return;
      }
      if (mode === "reset-code") {
        const verified = await signIn.resetPasswordEmailCode.verifyCode({
          code: values.code.trim(),
        });
        if (verified.error) throw verified.error;
        setMode("reset-password");
        return;
      }
      if (mode === "reset-password") {
        const updated = await signIn.resetPasswordEmailCode.submitPassword({
          password: values.password,
        });
        if (updated.error) throw updated.error;
        const finalized = await signIn.finalize();
        if (finalized.error) throw finalized.error;
        return;
      }
      if (mode === "sign-in") {
        const created = await signIn.create({
          identifier: values.email.trim(),
          password: values.password,
        });
        if (created.error) throw created.error;
        if (signIn.status !== "complete") {
          throw new Error("Additional verification is required. Try signing in with Google.");
        }
        const finalized = await signIn.finalize();
        if (finalized.error) throw finalized.error;
        return;
      }

      if (mode === "sign-up") {
        const created = await signUp.create({
          emailAddress: values.email.trim(),
          password: values.password,
        });
        if (created.error) throw created.error;
        const sent = await signUp.verifications.sendEmailCode();
        if (sent.error) throw sent.error;
        clearErrors();
        setResendPending(true);
        setDestinationEmail(values.email.trim());
        setMode("verify");
        return;
      }

      const verified = await signUp.verifications.verifyEmailCode({
        code: values.code.trim(),
      });
      if (verified.error) throw verified.error;
      if (signUp.status !== "complete" || !signUp.createdSessionId) {
        throw new Error("That code could not be verified. Please try again.");
      }
      const finalized = await signUp.finalize();
      if (finalized.error) throw finalized.error;
    } catch (caught) {
      setError("root.server", { message: readableError(caught) });
    }
  });

  const isReady = isValid;

  return (
    <SafeArea>
      <KeyboardView>
        <ScrollView
          className="w-full max-w-md self-center"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="flex-grow gap-6 p-4 py-8 sm:p-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-4">
            <BrandMark size="lg" />
            <View className="gap-2">
              <Text selectable variant="h2">
                {mode === "sign-in"
                  ? "Welcome back"
                  : mode === "sign-up"
                    ? "Create your account"
                    : mode === "reset-request"
                      ? "Reset your password"
                      : mode === "reset-password"
                        ? "Choose a new password"
                        : "Check your inbox"}
              </Text>
              <Text className="text-muted-foreground" selectable>
                {mode === "sign-in"
                  ? "Sign in to continue planning your groceries."
                  : mode === "sign-up"
                    ? "Create an account to save plans and grocery lists."
                    : mode === "reset-request"
                      ? "Enter your email and we’ll send you a reset code."
                      : mode === "reset-password"
                        ? "Use at least 8 characters for your new password."
                        : `Enter the six-digit code sent to ${verificationEmail}.`}
              </Text>
            </View>
          </View>

          <View className="gap-4">
            {!isCode ? (
              <>
                {mode !== "reset-password" ? (
                  <FormInput
                    testID="auth-email"
                    shouldUnregister
                    disabled={busy}
                    control={control}
                    label="Email address"
                    name="email"
                    rules={{
                      pattern: {
                        message: "Enter a valid email address.",
                        value: EMAIL_PATTERN,
                      },
                      required: "Enter your email address.",
                    }}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    placeholder="name@example.com"
                    onSubmitEditing={() =>
                      mode === "reset-request" ? void submitCredentials() : setFocus("password")
                    }
                    returnKeyType={mode === "reset-request" ? "done" : "next"}
                  />
                ) : null}
                {mode !== "reset-request" ? (
                  <View className="gap-1">
                    <FormInput
                      testID="auth-password"
                      shouldUnregister
                      disabled={busy}
                      control={control}
                      label={mode === "reset-password" ? "New password" : "Password"}
                      name="password"
                      rules={{
                        minLength: {
                          message: "Use at least 8 characters.",
                          value: mode === "sign-in" ? 1 : 8,
                        },
                        required: "Enter your password.",
                      }}
                      autoCapitalize="none"
                      autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                      onSubmitEditing={() => void submitCredentials()}
                      description={mode === "sign-in" ? undefined : "Use at least 8 characters."}
                      placeholder={mode === "sign-in" ? "Your password" : "At least 8 characters"}
                      returnKeyType="done"
                      secureTextEntry={!passwordVisible}
                    />
                    <View className="flex-row flex-wrap justify-between">
                      <Button
                        variant="ghost"
                        disabled={busy}
                        accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
                        onPress={() => setPasswordVisible(!passwordVisible)}
                        icon={
                          <Icon
                            as={passwordVisible ? EyeOff : Eye}
                            className="size-4 text-primary"
                          />
                        }
                      >
                        {passwordVisible ? "Hide password" : "Show password"}
                      </Button>
                      {mode === "sign-in" ? (
                        <Button
                          variant="link"
                          disabled={busy}
                          onPress={() => changeMode("reset-request")}
                        >
                          Forgot password?
                        </Button>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              <FormInput
                testID="auth-code"
                shouldUnregister
                disabled={busy}
                control={control}
                label="Verification code"
                name="code"
                rules={{
                  pattern: { message: "Enter the six-digit code.", value: /^\d{6}$/u },
                  required: "Enter the verification code.",
                }}
                autoComplete="one-time-code"
                keyboardType="number-pad"
                maxLength={6}
                onSubmitEditing={() => void submitCredentials()}
                placeholder="123456"
                returnKeyType="done"
              />
            )}

            {notice ? <Alert title={notice} variant="success" /> : null}
            {errors.root?.server?.message ? (
              <Alert title={errors.root.server.message} variant="destructive" />
            ) : null}
            <Button
              testID="auth-submit"
              disabled={!isReady || oauthBusy || codeBusy}
              loading={isSubmitting}
              size="lg"
              onPress={() => void submitCredentials()}
            >
              {mode === "sign-in"
                ? "Sign in"
                : mode === "sign-up"
                  ? "Create account"
                  : mode === "reset-request"
                    ? "Send reset code"
                    : mode === "reset-code"
                      ? "Verify code"
                      : mode === "reset-password"
                        ? "Save password and sign in"
                        : "Verify email"}
            </Button>
          </View>

          {isCode ? (
            <View className="gap-1">
              <Button
                variant="outline"
                disabled={busy || resendPending}
                loading={codeBusy}
                onPress={() => void resendCode()}
              >
                {resendPending ? "You can resend in 30 seconds" : "Resend code"}
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onPress={() => changeMode(mode === "verify" ? "sign-up" : "reset-request")}
              >
                Use a different email
              </Button>
            </View>
          ) : null}
          {isCredentials ? (
            <View className="gap-6">
              <View className="flex-row items-center gap-3">
                <Separator className="flex-1" />
                <Text className="text-muted-foreground" variant="small">
                  or continue with
                </Text>
                <Separator className="flex-1" />
              </View>
              <Button
                disabled={busy}
                loading={oauthBusy}
                size="lg"
                variant="outline"
                onPress={() => void authenticateWithGoogle()}
              >
                Continue with Google
              </Button>
            </View>
          ) : null}

          <View className="items-center gap-1">
            <Text className="text-muted-foreground" variant="small">
              {mode === "sign-in" ? "Don’t have an account?" : "Already have an account?"}
            </Text>
            <Button
              disabled={busy}
              onPress={() => {
                changeMode(mode === "sign-in" ? "sign-up" : "sign-in");
              }}
              variant="link"
            >
              {mode === "sign-in" ? "Sign up" : "Sign in"}
            </Button>
          </View>
        </ScrollView>
      </KeyboardView>
    </SafeArea>
  );
}
