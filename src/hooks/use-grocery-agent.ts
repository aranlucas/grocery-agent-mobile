import { useAuth } from "@clerk/expo";
import { useAgent, useCopilotKit, type UseAgentUpdate } from "@copilotkit/react-native/headless";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runAuthenticated, readableError } from "@/lib/auth";
import {
  CONNECT_FATAL_CODES,
  type CopilotErrorSource,
  observeCopilotOperation,
  RUN_FATAL_CODES,
} from "@/lib/copilot-operation";
import {
  INITIAL_GROCERY_STATE,
  normalizeGroceryState,
  stabilizeDisplayMessages,
  stabilizeGroceryState,
  toDisplayMessages,
} from "@/lib/grocery-state";

const ON_MESSAGES_CHANGED = "OnMessagesChanged" as UseAgentUpdate;
const ON_STATE_CHANGED = "OnStateChanged" as UseAgentUpdate;
const ON_RUN_STATUS_CHANGED = "OnRunStatusChanged" as UseAgentUpdate;
const RUN_STATUS_UPDATES = [ON_RUN_STATUS_CHANGED];
const STATE_UPDATES = [ON_STATE_CHANGED];
const MESSAGE_UPDATES = [ON_MESSAGES_CHANGED, ON_RUN_STATUS_CHANGED];

export type GroceryOperationOutcome =
  | { status: "success" }
  | { status: "stopped"; reason: "cancelled" | "busy" | "noop" }
  | { status: "failed"; error: Error; message: string };

export type GroceryAgentFailure =
  | { operation: "send" | "retry"; message: string; input: string }
  | { operation: "open-thread"; message: string; threadId: string };

type GroceryOperationKind = "send" | "retry" | "new-chat" | "open-thread";

type ActiveGroceryOperation = {
  kind: GroceryOperationKind;
  cancellation: AbortController;
  detached: boolean;
  sdkStarted: boolean;
  promise: Promise<GroceryOperationOutcome>;
};

const success = (): GroceryOperationOutcome => ({ status: "success" });
const stopped = (reason: "cancelled" | "busy" | "noop"): GroceryOperationOutcome => ({
  status: "stopped",
  reason,
});

export function useGroceryAgentController(onRunComplete: () => void) {
  const { agent } = useAgent({
    agentId: "grocery",
    updates: RUN_STATUS_UPDATES,
    throttleMs: 50,
  });
  const { copilotkit } = useCopilotKit();
  const { getToken, userId } = useAuth();
  const [failure, setFailure] = useState<GroceryAgentFailure | null>(null);
  const [activeKind, setActiveKind] = useState<GroceryOperationKind | null>(null);
  const activeOperation = useRef<ActiveGroceryOperation | null>(null);
  const isRunning = activeKind !== null || (agent?.isRunning ?? false);
  const clearError = useCallback(() => setFailure(null), []);

  useEffect(() => {
    if (copilotkit.runtimeConnectionStatus !== "connected") return;
    if (!agent.state?.recipe) {
      agent.setState({ ...INITIAL_GROCERY_STATE, ...agent.state });
    }
  }, [agent, copilotkit.runtimeConnectionStatus]);

  useEffect(() => {
    return () => {
      const operation = activeOperation.current;
      if (!operation) return;
      // A disposed session must neither start work after auth resolves nor
      // restore its snapshot over a conversation owned by a new controller.
      operation.detached = true;
      if (operation.cancellation.signal.aborted) return;
      operation.cancellation.abort();
      if (operation.sdkStarted && agent) copilotkit.stopAgent({ agent });
    };
  }, [agent, copilotkit, userId]);

  const finishOperation = useCallback((operation: ActiveGroceryOperation) => {
    if (activeOperation.current !== operation) return;
    activeOperation.current = null;
    setActiveKind(null);
  }, []);

  const runMessage = useCallback(
    (kind: "send" | "retry", rawContent: string): Promise<GroceryOperationOutcome> => {
      const content = rawContent.trim();
      if (!content || !agent) return Promise.resolve(stopped("noop"));
      if (activeOperation.current) return Promise.resolve(stopped("busy"));

      const snapshot = {
        messages: [...agent.messages],
        state: structuredClone(agent.state ?? {}),
        pendingInterrupts: [...agent.pendingInterrupts],
      };
      const operation: ActiveGroceryOperation = {
        kind,
        cancellation: new AbortController(),
        detached: false,
        sdkStarted: false,
        promise: Promise.resolve(stopped("noop")),
      };
      activeOperation.current = operation;
      setActiveKind(kind);
      setFailure(null);

      const restoreSnapshot = () => {
        agent.setMessages(snapshot.messages);
        agent.setState(snapshot.state);
        agent.pendingInterrupts = snapshot.pendingInterrupts;
      };

      operation.promise = (async () => {
        try {
          const emittedError = await runAuthenticated({
            transport: copilotkit,
            getToken,
            userId,
            signal: operation.cancellation.signal,
            run: async () => {
              if (operation.cancellation.signal.aborted) return null;
              agent.addMessage({
                id: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                role: "user",
                content,
              });
              operation.sdkStarted = true;
              return observeCopilotOperation({
                source: copilotkit as unknown as CopilotErrorSource,
                agentId: "grocery",
                threadId: agent.threadId,
                fatalCodes: RUN_FATAL_CODES,
                isStopped: () => operation.cancellation.signal.aborted,
                run: () => copilotkit.runAgent({ agent }),
              });
            },
          });

          if (operation.cancellation.signal.aborted) {
            setFailure(null);
            return stopped("cancelled");
          }
          if (emittedError) {
            restoreSnapshot();
            const message = readableError(emittedError);
            setFailure({ operation: kind, message, input: content });
            return { status: "failed", error: emittedError, message };
          }

          setFailure(null);
          onRunComplete();
          return success();
        } catch (caught) {
          if (operation.cancellation.signal.aborted) {
            setFailure(null);
            return stopped("cancelled");
          }
          restoreSnapshot();
          const error = caught instanceof Error ? caught : new Error(readableError(caught));
          const message = readableError(error);
          setFailure({ operation: kind, message, input: content });
          return { status: "failed", error, message };
        } finally {
          finishOperation(operation);
        }
      })();

      return operation.promise;
    },
    [agent, copilotkit, finishOperation, getToken, onRunComplete, userId],
  );

  const send = useCallback((content: string) => runMessage("send", content), [runMessage]);

  const retry = useCallback(() => {
    if (!failure || failure.operation === "open-thread") {
      return Promise.resolve(stopped("noop"));
    }
    return runMessage("retry", failure.input);
  }, [failure, runMessage]);

  const stop = useCallback(async (): Promise<GroceryOperationOutcome> => {
    const operation = activeOperation.current;
    if (!operation) return stopped("noop");

    operation.cancellation.abort();
    if (operation.sdkStarted && !operation.detached && agent) copilotkit.stopAgent({ agent });
    await operation.promise;
    return stopped("cancelled");
  }, [agent, copilotkit]);

  const reserveTransition = useCallback(
    (
      kind: "new-chat" | "open-thread",
      run: (operation: ActiveGroceryOperation) => Promise<GroceryOperationOutcome>,
    ): Promise<GroceryOperationOutcome> => {
      const previous = activeOperation.current;
      if (previous?.kind === "new-chat" || previous?.kind === "open-thread") {
        return Promise.resolve(stopped("busy"));
      }

      const operation: ActiveGroceryOperation = {
        kind,
        cancellation: new AbortController(),
        detached: false,
        sdkStarted: false,
        promise: Promise.resolve(stopped("noop")),
      };
      activeOperation.current = operation;
      setActiveKind(kind);

      operation.promise = (async () => {
        try {
          if (previous) {
            previous.cancellation.abort();
            if (previous.sdkStarted && !previous.detached && agent) copilotkit.stopAgent({ agent });
            await previous.promise;
          }
          if (operation.cancellation.signal.aborted) return stopped("cancelled");
          return await run(operation);
        } finally {
          finishOperation(operation);
        }
      })();

      return operation.promise;
    },
    [agent, copilotkit, finishOperation],
  );

  const startNewChat = useCallback(() => {
    if (!agent) return Promise.resolve(stopped("noop"));
    return reserveTransition("new-chat", async () => {
      agent.threadId = `grocery_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      agent.pendingInterrupts = [];
      agent.setMessages([]);
      agent.setState(INITIAL_GROCERY_STATE);
      setFailure(null);
      return success();
    });
  }, [agent, reserveTransition]);

  const openThread = useCallback(
    (threadId: string) => {
      const nextThreadId = threadId.trim();
      if (!agent || !nextThreadId) return Promise.resolve(stopped("noop"));
      if (agent.threadId === nextThreadId && !activeOperation.current) {
        return Promise.resolve(success());
      }

      return reserveTransition("open-thread", async (operation) => {
        const snapshot = {
          threadId: agent.threadId,
          messages: [...agent.messages],
          state: structuredClone(agent.state ?? {}),
          pendingInterrupts: [...agent.pendingInterrupts],
        };
        const restoreSnapshot = () => {
          agent.threadId = snapshot.threadId;
          agent.setMessages(snapshot.messages);
          agent.setState(snapshot.state);
          agent.pendingInterrupts = snapshot.pendingInterrupts;
        };

        setFailure(null);
        agent.threadId = nextThreadId;
        agent.pendingInterrupts = [];
        agent.setMessages([]);
        agent.setState(INITIAL_GROCERY_STATE);

        try {
          const emittedError = await runAuthenticated({
            transport: copilotkit,
            getToken,
            userId,
            signal: operation.cancellation.signal,
            run: async () => {
              if (operation.cancellation.signal.aborted) return null;
              operation.sdkStarted = true;
              return observeCopilotOperation({
                source: copilotkit as unknown as CopilotErrorSource,
                agentId: "grocery",
                threadId: nextThreadId,
                fatalCodes: CONNECT_FATAL_CODES,
                isStopped: () => operation.cancellation.signal.aborted,
                run: () => copilotkit.connectAgent({ agent }),
              });
            },
          });

          if (operation.cancellation.signal.aborted) {
            if (!operation.detached) restoreSnapshot();
            return stopped("cancelled");
          }
          if (emittedError) throw emittedError;
          return success();
        } catch (caught) {
          if (!operation.detached) restoreSnapshot();
          if (operation.cancellation.signal.aborted) return stopped("cancelled");
          const error = caught instanceof Error ? caught : new Error(readableError(caught));
          const message = readableError(error);
          setFailure({
            operation: "open-thread",
            message,
            threadId: nextThreadId,
          });
          return { status: "failed", error, message };
        }
      });
    },
    [agent, copilotkit, getToken, reserveTransition, userId],
  );

  return useMemo(
    () => ({
      activeThreadId: agent?.threadId,
      isRunning,
      failure,
      error: failure?.message ?? "",
      failedInput: failure && failure.operation !== "open-thread" ? failure.input : null,
      clearError,
      send,
      retry,
      stop,
      startNewChat,
      openThread,
    }),
    [agent?.threadId, isRunning, failure, clearError, send, retry, stop, startNewChat, openThread],
  );
}

export function useGroceryState() {
  const { agent } = useAgent({
    agentId: "grocery",
    updates: STATE_UPDATES,
    throttleMs: 50,
  });
  const previousState = useRef(normalizeGroceryState({}));
  const state = stabilizeGroceryState(previousState.current, normalizeGroceryState(agent?.state));

  useEffect(() => {
    previousState.current = state;
  }, [state]);

  return state;
}

export function useGroceryMessages() {
  const { agent } = useAgent({
    agentId: "grocery",
    updates: MESSAGE_UPDATES,
    throttleMs: 50,
  });
  const previousMessages = useRef<ReturnType<typeof toDisplayMessages>>([]);
  const messages = stabilizeDisplayMessages(
    previousMessages.current,
    toDisplayMessages(agent?.messages ?? []),
  );

  useEffect(() => {
    previousMessages.current = messages;
  }, [messages]);

  return useMemo(
    () => ({ messages, isStreaming: agent?.isRunning ?? false }),
    [agent?.isRunning, messages],
  );
}
