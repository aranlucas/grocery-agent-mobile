import { useReview, reviewUser } from "@/review-fixtures";
export const ClerkProvider = ({ children }) => children;
export const ClerkLoaded = ({ children }) => children;
export const ClerkLoading = () => null;
export function Show({ when, children }) {
  const state = useReview();
  return (when === "signed-in") === state.signedIn ? children : null;
}
export function useUser() {
  return { user: reviewUser, isLoaded: true };
}
export function useAuth() {
  return { userId: reviewUser.id, isLoaded: true, getToken: async () => "local-fixture" };
}
export function useClerk() {
  return { signOut: async () => globalThis.__groceryReview.scenario("signed-out") };
}
// Authentication responses are fixtures too; they never contact Clerk.
const success = async () => ({ error: null });
const verifyCode = async ({ code }) =>
  code === "123456" ? { error: null } : { error: new Error("That code is incorrect. Try again.") };
const finalize = async () => {
  globalThis.__groceryReview.scenario("content");
  return { error: null };
};
const signIn = {
  status: "complete",
  create: success,
  finalize,
  resetPasswordEmailCode: { sendCode: success, verifyCode, submitPassword: success },
};
const signUp = {
  status: "complete",
  createdSessionId: "local-fixture",
  create: success,
  finalize,
  verifications: { sendEmailCode: success, verifyEmailCode: verifyCode },
};
export function useSignIn() {
  return { signIn };
}
export function useSignUp() {
  return { signUp };
}
export function useSSO() {
  return { startSSOFlow: async () => ({}) };
}
