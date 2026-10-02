import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { createElement } from "react";
import { act, create } from "react-test-renderer";
import { createSession, SessionContext } from "./test-support/grocery-agent.mjs";

// Node's built-in TypeScript support does not resolve Metro's @/ alias. Keep
// native SDKs out of these tests and supply deterministic external adapters.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (["@clerk/expo", "@copilotkit/react-native/headless"].includes(specifier)) {
      return {
        url: new URL("./test-support/grocery-agent.mjs", import.meta.url).href,
        shortCircuit: true,
      };
    }
    if (specifier.startsWith("@/")) {
      return {
        url: new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});
const { useGroceryAgentController } = await import("../src/hooks/use-grocery-agent.ts");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function mountController(t, session = createSession()) {
  let current;
  let renderer;
  function Probe() {
    current = useGroceryAgentController(session.onRunComplete);
    return null;
  }
  await act(async () => {
    renderer = create(createElement(SessionContext, { value: session }, createElement(Probe)));
  });
  const unmount = async () => {
    await act(async () => renderer.unmount());
  };
  t.after(unmount);
  return {
    session,
    unmount,
    async rerender() {
      await act(async () => {
        renderer.update(createElement(SessionContext, { value: session }, createElement(Probe)));
      });
    },
    get current() {
      return current;
    },
    async start(command) {
      let promise;
      await act(async () => {
        promise = command(current);
      });
      return { promise };
    },
    async finish(command) {
      let outcome;
      await act(async () => {
        outcome = await command(current);
      });
      return outcome;
    },
  };
}

await test("rapid sends reserve during auth; stopping prevents a late SDK run", async (t) => {
  const session = createSession();
  const token = Promise.withResolvers();
  session.auth.getToken = () => token.promise;
  const control = await mountController(t, session);
  const first = await control.start((agent) => agent.send("  Milk  "));
  assert.equal(control.current.isRunning, true);
  assert.deepEqual(await control.current.send("Eggs"), { status: "stopped", reason: "busy" });
  const stop = await control.start((agent) => agent.stop());
  await act(async () => {
    token.resolve("test-token");
    assert.deepEqual(await first.promise, { status: "stopped", reason: "cancelled" });
    await stop.promise;
  });
  assert.equal(control.session.calls.run, 0);
  assert.equal(control.current.isRunning, false);
  assert.equal(control.current.failure, null);
  assert.equal(control.session.calls.completed, 0);
});

await test("emitted run failure rolls back and exposes the same input for retry", async (t) => {
  const control = await mountController(t);
  const { session } = control;
  const before = session.snapshot();
  const error = new Error("Network unavailable");
  session.handlers.run = async (agent) => {
    agent.setState({ notes: "Partial result" });
    agent.pendingInterrupts = [];
    session.emit(error, { threadId: agent.threadId });
  };
  const outcome = await control.finish((agent) => agent.send("  Milk  "));
  assert.equal(outcome.status, "failed");
  assert.equal(outcome.error, error);
  assert.deepEqual(session.snapshot(), before);
  assert.equal(control.current.failedInput, "Milk");
  assert.equal(control.current.error, error.message);
  assert.equal(session.subscriptions, 0);
  session.handlers.run = async () => {};
  assert.deepEqual(await control.finish((agent) => agent.retry()), { status: "success" });
  assert.equal(session.agent.messages.at(-1).content, "Milk");
  assert.equal(session.calls.run, 2);
  assert.equal(session.calls.completed, 1);
  assert.equal(control.current.failure, null);
  assert.equal(session.subscriptions, 0);
});

await test("unrelated agent errors and nonfatal errors do not fail the active send", async (t) => {
  const control = await mountController(t);
  control.session.handlers.run = async () => {
    control.session.emit(new Error("Other agent"), { agentId: "another-agent" });
    control.session.emit(new Error("Nonfatal"), { code: "diagnostic" });
  };
  assert.deepEqual(await control.finish((agent) => agent.send("Milk")), { status: "success" });
  assert.equal(control.session.subscriptions, 0);
});

await test("rejected runs restore conversation state and clean up subscriptions", async (t) => {
  const control = await mountController(t);
  const before = control.session.snapshot();
  control.session.handlers.run = async () => {
    throw new Error("Disconnected");
  };
  assert.equal((await control.finish((agent) => agent.send("Milk"))).status, "failed");
  assert.deepEqual(control.session.snapshot(), before);
  assert.equal(control.current.failedInput, "Milk");
  assert.equal(control.session.subscriptions, 0);
  assert.equal(control.current.isRunning, false);
});

await test("opening a thread joins the stopped run and restores it if connection fails", async (t) => {
  const control = await mountController(t);
  const { session } = control;
  const run = Promise.withResolvers();
  session.handlers.run = () => run.promise;
  const sending = await control.start((agent) => agent.send("Milk"));
  const before = session.snapshot();
  session.handlers.connect = async () => {
    session.emit(new Error("Cannot open chat"), { code: "agent_connect_failed" });
  };
  const opening = await control.start((agent) => agent.openThread("another-thread"));
  assert.equal(session.calls.stop, 1);
  assert.equal(session.calls.connect, 0);
  assert.deepEqual(await control.current.openThread("third-thread"), {
    status: "stopped",
    reason: "busy",
  });
  await act(async () => {
    run.resolve();
    assert.deepEqual(await sending.promise, { status: "stopped", reason: "cancelled" });
    assert.equal((await opening.promise).status, "failed");
  });
  assert.equal(session.calls.connect, 1);
  assert.deepEqual(session.snapshot(), before);
  assert.equal(control.current.failure.operation, "open-thread");
  assert.equal(control.current.failedInput, null);
  assert.equal(session.subscriptions, 0);
});

for (const authOutcome of ["resolved", "rejected"]) {
  await test(`stopping a thread open during ${authOutcome} auth restores the chat without an error`, async (t) => {
    const session = createSession();
    const token = Promise.withResolvers();
    session.auth.getToken = () => token.promise;
    const control = await mountController(t, session);
    const before = session.snapshot();
    const opening = await control.start((agent) => agent.openThread("another-thread"));
    const stop = await control.start((agent) => agent.stop());
    await act(async () => {
      if (authOutcome === "resolved") token.resolve("test-token");
      else token.reject(new Error("Offline"));
      assert.deepEqual(await opening.promise, { status: "stopped", reason: "cancelled" });
      assert.deepEqual(await stop.promise, { status: "stopped", reason: "cancelled" });
    });
    assert.deepEqual(control.session.snapshot(), before);
    assert.equal(control.session.calls.connect, 0);
    assert.equal(control.current.failure, null);
    assert.equal(control.current.isRunning, false);
  });
}

await test("stopping a rejected SDK connection is cancellation, not a failed thread open", async (t) => {
  const control = await mountController(t);
  const before = control.session.snapshot();
  const connection = Promise.withResolvers();
  control.session.handlers.connect = () => connection.promise;
  const opening = await control.start((agent) => agent.openThread("another-thread"));
  const stop = await control.start((agent) => agent.stop());
  assert.equal(control.session.calls.stop, 1);
  await act(async () => {
    connection.reject(new Error("Aborted"));
    assert.deepEqual(await opening.promise, { status: "stopped", reason: "cancelled" });
    await stop.promise;
  });
  assert.deepEqual(control.session.snapshot(), before);
  assert.equal(control.current.failure, null);
  assert.equal(control.session.subscriptions, 0);
});

await test("new chat waits for the old run; its late rejection cannot restore the old chat", async (t) => {
  const control = await mountController(t);
  const run = Promise.withResolvers();
  control.session.handlers.run = () => run.promise;
  const sending = await control.start((agent) => agent.send("Milk"));
  const starting = await control.start((agent) => agent.startNewChat());
  assert.equal(control.session.agent.threadId, "original-thread");
  await act(async () => {
    run.reject(new Error("Old run ended"));
    assert.equal((await sending.promise).status, "stopped");
    assert.deepEqual(await starting.promise, { status: "success" });
  });
  assert.notEqual(control.current.activeThreadId, "original-thread");
  assert.deepEqual(control.session.agent.messages, []);
  assert.deepEqual(control.session.agent.pendingInterrupts, []);
  assert.equal(control.current.failure, null);
  assert.equal(control.session.subscriptions, 0);
});

await test("late errors from an old thread do not roll back a newer thread connection", async (t) => {
  const control = await mountController(t);
  const { session } = control;
  session.handlers.connect = async (agent) => {
    agent.setMessages([{ id: "new", role: "assistant", content: "New conversation" }]);
    session.emit(new Error("Old replay failed"), {
      code: "agent_connect_failed",
      threadId: "original-thread",
    });
  };
  assert.deepEqual(await control.finish((agent) => agent.openThread("another-thread")), {
    status: "success",
  });
  assert.equal(control.current.activeThreadId, "another-thread");
  assert.equal(session.agent.messages[0].content, "New conversation");
  assert.equal(control.current.failure, null);
  assert.equal(session.subscriptions, 0);
});

await test("unmount while refreshing auth prevents a late send", async (t) => {
  const session = createSession();
  const token = Promise.withResolvers();
  session.auth.getToken = () => token.promise;
  const control = await mountController(t, session);
  const sending = await control.start((agent) => agent.send("Milk"));
  await control.unmount();
  token.resolve("test-token");
  assert.deepEqual(await sending.promise, { status: "stopped", reason: "cancelled" });
  assert.equal(control.session.calls.run, 0);
  assert.equal(control.session.calls.completed, 0);
  assert.deepEqual(control.session.copilotkit.headers, {});
});

await test("unmount stops the in-flight run and ignores its late completion", async (t) => {
  const control = await mountController(t);
  const run = Promise.withResolvers();
  control.session.handlers.run = () => run.promise;
  const sending = await control.start((agent) => agent.send("Milk"));
  await control.unmount();
  assert.equal(control.session.calls.stop, 1);
  run.resolve();
  assert.deepEqual(await sending.promise, { status: "stopped", reason: "cancelled" });
  assert.equal(control.session.calls.completed, 0);
  assert.equal(control.session.subscriptions, 0);
});

await test("a disposed thread open cannot restore its snapshot over a remounted controller", async (t) => {
  const session = createSession();
  const oldController = await mountController(t, session);
  const connection = Promise.withResolvers();
  session.handlers.connect = () => connection.promise;
  const opening = await oldController.start((agent) => agent.openThread("abandoned-thread"));
  await oldController.unmount();

  const nextController = await mountController(t, session);
  session.handlers.connect = async (agent) => {
    agent.setMessages([{ id: "new", role: "assistant", content: "New conversation" }]);
  };
  assert.deepEqual(await nextController.finish((agent) => agent.openThread("new-thread")), {
    status: "success",
  });
  const newConversation = session.snapshot();
  connection.reject(new Error("Old connection ended"));
  assert.deepEqual(await opening.promise, { status: "stopped", reason: "cancelled" });
  assert.deepEqual(session.snapshot(), newConversation);
  assert.equal(nextController.current.failure, null);
  assert.equal(session.subscriptions, 0);
});

await test("blank commands, retry without a failure, and idle stop leave the chat alone", async (t) => {
  const control = await mountController(t);
  const before = control.session.snapshot();
  for (const command of [
    (agent) => agent.send("  "),
    (agent) => agent.openThread("  "),
    (agent) => agent.retry(),
    (agent) => agent.stop(),
  ]) {
    assert.deepEqual(await control.finish(command), { status: "stopped", reason: "noop" });
  }
  assert.deepEqual(await control.finish((agent) => agent.openThread("original-thread")), {
    status: "success",
  });
  assert.deepEqual(control.session.snapshot(), before);
  assert.equal(control.session.calls.connect, 0);
  assert.equal(control.session.calls.run, 0);
});

await test("replacing the SDK agent cancels old work without stopping the replacement", async (t) => {
  const control = await mountController(t);
  const { session } = control;
  const oldAgent = session.agent;
  const stoppedAgents = [];
  const run = Promise.withResolvers();
  session.handlers.run = () => run.promise;
  session.handlers.stop = (agent) => stoppedAgents.push(agent);
  const sending = await control.start((agent) => agent.send("Milk"));
  session.agent = createSession().agent;
  await control.rerender();
  const stopping = await control.start((agent) => agent.stop());
  const starting = await control.start((agent) => agent.startNewChat());
  assert.deepEqual(stoppedAgents, [oldAgent]);
  await act(async () => {
    run.resolve();
    assert.equal((await sending.promise).status, "stopped");
    assert.equal((await stopping.promise).status, "stopped");
    assert.deepEqual(await starting.promise, { status: "success" });
  });
  assert.equal(control.current.isRunning, false);
  assert.equal(control.current.failure, null);
  assert.equal(session.calls.completed, 0);
});
