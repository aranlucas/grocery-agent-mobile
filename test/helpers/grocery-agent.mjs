import { createContext, useContext } from "react";

// Only the external Clerk/Copilot hooks are replaced. The controller and its
// auth, snapshot, cancellation, and error-observation logic run unchanged.
export const SessionContext = createContext(null);

export function useAuth() {
  return useContext(SessionContext).auth;
}

export function useAgent() {
  return { agent: useContext(SessionContext).agent };
}

export function useCopilotKit() {
  return { copilotkit: useContext(SessionContext).copilotkit };
}

export function createSession() {
  const subscribers = new Set();
  const calls = { run: 0, connect: 0, stop: 0, completed: 0 };
  const handlers = {
    run: async () => {},
    connect: async () => {},
    stop: () => {},
  };
  const agent = {
    threadId: "original-thread",
    messages: [{ id: "previous", role: "assistant", content: "Earlier conversation" }],
    state: { recipe: { title: "Dinner" }, notes: "Keep this list" },
    pendingInterrupts: [{ id: "original-interrupt" }],
    isRunning: false,
    setMessages(messages) {
      this.messages = messages;
    },
    setState(state) {
      this.state = state;
    },
    addMessage(message) {
      this.messages = [...this.messages, message];
    },
  };
  const copilotkit = {
    runtimeConnectionStatus: "connected",
    headers: {},
    setHeaders(headers) {
      this.headers = headers;
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return { unsubscribe: () => subscribers.delete(subscriber) };
    },
    runAgent({ agent }) {
      calls.run++;
      return handlers.run(agent);
    },
    connectAgent({ agent }) {
      calls.connect++;
      return handlers.connect(agent);
    },
    stopAgent({ agent }) {
      calls.stop++;
      handlers.stop(agent);
    },
  };

  return {
    agent,
    copilotkit,
    calls,
    handlers,
    auth: { userId: "test-user", getToken: async () => "test-token" },
    onRunComplete: () => calls.completed++,
    emit(error, { code = "agent_run_failed", agentId = "grocery", threadId } = {}) {
      for (const subscriber of subscribers) {
        subscriber.onError?.({ code, context: { agentId, threadId }, error });
      }
    },
    get subscriptions() {
      return subscribers.size;
    },
    snapshot() {
      return structuredClone({
        threadId: agent.threadId,
        messages: agent.messages,
        state: agent.state,
        pendingInterrupts: agent.pendingInterrupts,
      });
    },
  };
}
