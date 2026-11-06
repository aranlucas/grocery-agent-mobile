// CI-only identity adapter. Production Clerk is never replaced without GROCERY_E2E=1.
export function useAuth() {
  return { userId: "fixture-user", getToken: async () => "fixture-token" };
}
