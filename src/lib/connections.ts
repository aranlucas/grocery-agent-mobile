export type ExternalAccountLike = {
  provider: string;
  verification?: {
    status?: string | null;
    error?: { code?: string; longMessage?: string; message?: string } | null;
  } | null;
};

const KROGER_PROVIDERS = new Set(["oauth_custom_shopping", "custom_shopping"]);

export function isKrogerConnection(account: ExternalAccountLike): boolean {
  return KROGER_PROVIDERS.has(account.provider);
}

export function hasKrogerConnection(accounts: readonly ExternalAccountLike[]): boolean {
  return accounts.some(
    (account) => isKrogerConnection(account) && account.verification?.status === "verified",
  );
}

export function krogerConnectionError(account: ExternalAccountLike | undefined): string {
  if (!account || !isKrogerConnection(account) || account.verification?.status === "verified") {
    return "";
  }
  const error = account.verification?.error;
  if (error?.code === "oauth_identification_claimed") {
    return "This Kroger email is already registered to another Grocery Agent account. Sign in to that account to use Kroger.";
  }
  return error?.longMessage || error?.message || "";
}

export function rotatingTokenNonceFromCallback(callbackUrl: string): string {
  return new URL(callbackUrl).searchParams.get("rotating_token_nonce") ?? "";
}

export const KROGER_CALLBACK_DELAYS_MS = [250, 500, 1_000, 1_500, 2_000] as const;

function abortError(signal?: AbortSignal): Error {
  if (signal?.reason instanceof Error) return signal.reason;
  const error = new Error("The Kroger connection check was cancelled.");
  error.name = "AbortError";
  return error;
}

function wait(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError(signal));
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError(signal));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function waitForKrogerConnection<
  T extends { externalAccounts: readonly ExternalAccountLike[] },
>({
  reload,
  signal,
  waitForDelay = wait,
}: {
  reload: () => Promise<T>;
  signal?: AbortSignal;
  waitForDelay?: (delayMs: number, signal?: AbortSignal) => Promise<void>;
}): Promise<T> {
  for (const delay of KROGER_CALLBACK_DELAYS_MS) {
    await waitForDelay(delay, signal);
    const user = await reload();
    if (hasKrogerConnection(user.externalAccounts)) return user;
    const error = krogerConnectionError(user.externalAccounts.find(isKrogerConnection));
    if (error) throw new Error(error);
  }

  throw new Error("Kroger returned without completing the account connection.");
}
