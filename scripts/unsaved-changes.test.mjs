import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = ts.transpileModule(
  readFileSync(new URL("../src/hooks/use-unsaved-changes.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

// Exercise the actual hook with a deterministic render/effect boundary. SDK 57's
// removal callback supplies an action, and its prevention hook returns void.
function editor(canGoBack = true) {
  const events = [];
  let state = null;
  let effects;
  let buttons;
  let hardwareBack;
  let prevented;
  let removalCallback;
  const navigation = {
    dispatch: (action) => events.push(action),
    canGoBack: () => canGoBack,
    goBack: () => events.push("back"),
  };
  const modules = {
    react: {
      useCallback: (callback) => callback,
      useState: () => [state, (update) => (state = update())],
      useEffect: (callback) => effects.push(callback),
    },
    "expo-router/react-navigation": {
      usePreventRemove: (prevent, callback) => {
        removalCallback = callback;
        effects.push(() => (prevented = prevent));
      },
    },
    "expo-router": {
      useNavigation: () => navigation,
      useFocusEffect: (callback) => effects.push(callback),
    },
    "react-native": {
      Alert: { alert: (_title, _message, actions) => (buttons = actions) },
      BackHandler: {
        addEventListener: (_event, callback) => {
          hardwareBack = callback;
          return { remove() {} };
        },
        exitApp: () => events.push("exit"),
      },
    },
  };
  const exports = {};
  runInNewContext(source, { exports, require: (name) => modules[name] });
  return {
    events,
    render(dirty = true) {
      effects = [];
      const leave = exports.useUnsavedChanges(dirty, () => events.push("discard"));
      effects.forEach((effect) => effect());
      return leave;
    },
    remove: (action) => removalCallback({ data: { action } }),
    discard: () => buttons.find((button) => button.style === "destructive").onPress(),
    hardwareBack: () => hardwareBack(),
    get prevented() {
      return prevented;
    },
  };
}

void test("canceling removal retains edits; discarding replays the original SDK 57 action", () => {
  const app = editor();
  app.render();
  const action = { type: "GO_BACK", source: "editor" };
  app.remove(action);
  assert.deepEqual(app.events, []);
  assert.equal(app.prevented, true);
  app.discard();
  assert.deepEqual(app.events, ["discard", action]);
});

void test("saving navigates after the removal guard updates even before dirty reset", () => {
  const app = editor();
  const leave = app.render();
  leave(() => {
    assert.equal(app.prevented, false);
    app.events.push("saved");
  });
  assert.deepEqual(app.events, []);
  app.render();
  assert.deepEqual(app.events, ["saved"]);
});

for (const canGoBack of [true, false]) {
  void test(`Android discard ${canGoBack ? "goes back" : "exits a root deep link"} after prevention updates`, () => {
    const app = editor(canGoBack);
    app.render();
    assert.equal(app.hardwareBack(), true);
    assert.deepEqual(app.events, []);
    app.discard();
    assert.deepEqual(app.events, ["discard"]);
    app.render();
    assert.equal(app.prevented, false);
    assert.deepEqual(app.events, ["discard", canGoBack ? "back" : "exit"]);
  });
}
