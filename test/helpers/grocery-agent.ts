import { createContext, useContext } from "react";
import type { CopilotErrorEvent } from "@/lib/copilot-operation";

type Message = { id: string; role: string; content: string };
export type FixtureAgent = {
  threadId: string;
  messages: Message[];
  state: Record<string, unknown>;
  pendingInterrupts: { id: string }[];
  isRunning: boolean;
  setMessages(messages: Message[]): void;
  setState(state: Record<string, unknown>): void;
  addMessage(message: Message): void;
};
type Subscriber = { onError?: (event: CopilotErrorEvent) => void };
type Session = ReturnType<typeof createSession>;

// Only the external Clerk/Copilot hooks are replaced. The controller and its
// auth, snapshot, cancellation, and error-observation logic run unchanged.
export const SessionContext = createContext<Session | null>(null);

function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Missing test session");
  return session;
}

export function useAuth() {
  return useSession().auth;
}

export function useAgent() {
  return { agent: useSession().agent };
}

export function useCopilotKit() {
  return { copilotkit: useSession().copilotkit };
}

export function createSession() {
  const subscribers = new Set<Subscriber>();
  const calls = { run: 0, connect: 0, stop: 0, completed: 0 };
  const handlers: {
    run: (agent: FixtureAgent) => Promise<unknown>;
    connect: (agent: FixtureAgent) => Promise<unknown>;
    stop: (agent: FixtureAgent) => void;
  } = {
    run: async () => {},
    connect: async () => {},
    stop: () => {},
  };
  const agent: FixtureAgent = {
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
    headers: {} as Record<string, string>,
    setHeaders(headers: Record<string, string>) {
      this.headers = headers;
    },
    subscribe(subscriber: Subscriber) {
      subscribers.add(subscriber);
      return { unsubscribe: () => subscribers.delete(subscriber) };
    },
    runAgent({ agent }: { agent: FixtureAgent }) {
      calls.run++;
      return handlers.run(agent);
    },
    connectAgent({ agent }: { agent: FixtureAgent }) {
      calls.connect++;
      return handlers.connect(agent);
    },
    stopAgent({ agent }: { agent: FixtureAgent }) {
      calls.stop++;
      handlers.stop(agent);
    },
  };

  return {
    agent,
    copilotkit,
    calls,
    handlers,
    auth: { userId: "test-user", getToken: async (): Promise<string | null> => "test-token" },
    onRunComplete: () => calls.completed++,
    emit(
      error: Error,
      {
        code = "agent_run_failed",
        agentId = "grocery",
        threadId,
      }: { code?: string; agentId?: string; threadId?: string } = {},
    ) {
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
