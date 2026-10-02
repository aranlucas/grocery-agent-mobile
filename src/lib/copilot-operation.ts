export type CopilotErrorEvent = {
  code: string;
  context: Record<string, unknown>;
  error: Error;
};

export type CopilotErrorSource = {
  subscribe(subscriber: { onError?: (event: CopilotErrorEvent) => void | Promise<void> }): {
    unsubscribe(): void;
  };
};

export const RUN_FATAL_CODES = new Set([
  "agent_run_failed",
  "agent_run_failed_event",
  "agent_run_error_event",
  "agent_thread_locked",
]);

export const CONNECT_FATAL_CODES = new Set([...RUN_FATAL_CODES, "agent_connect_failed"]);

export async function observeCopilotOperation({
  source,
  agentId,
  threadId,
  fatalCodes,
  isStopped,
  run,
}: {
  source: CopilotErrorSource;
  agentId: string;
  threadId?: string;
  fatalCodes: ReadonlySet<string>;
  isStopped: () => boolean;
  run: () => Promise<unknown>;
}): Promise<Error | null> {
  let emittedError: Error | null = null;
  const subscription = source.subscribe({
    onError: ({ code, context, error }) => {
      if (isStopped() || emittedError) return;
      if (context.agentId !== agentId || !fatalCodes.has(code)) return;
      // Replay tool processing can report an error after a previous thread's
      // connect promise has settled. Unscoped SDK errors still belong to the
      // serialized active operation, but explicitly different threads do not.
      if (threadId && typeof context.threadId === "string" && context.threadId !== threadId) return;
      emittedError = error;
    },
  });

  try {
    await run();
    return emittedError;
  } finally {
    subscription.unsubscribe();
  }
}
