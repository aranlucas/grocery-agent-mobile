// Deterministic, local-only scenarios. This file is copied into a temporary QA
// workspace by ui-review.mjs. The production app never imports it.
import { useEffect, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
const listeners = new Set();
let client;
let failNext = false;
let scenario = "content";
const now = Date.now();
const household = { id: "home-1", name: "Maple House", role: "owner", created_at: now };
const ingredient = (id, name, quantity = "1", unit = "") => ({
  id,
  name,
  quantity,
  unit,
  note: "",
});
const recipe = {
  id: "recipe-1",
  household_id: null,
  title: "Lemony chickpea bowls",
  description: "A bright, easy dinner with crisp greens and a creamy yogurt dressing.",
  servings: "2",
  notes: "Keep the dressing separate until serving.",
  tags: ["Quick dinners", "Vegetarian"],
  ingredients: [
    ingredient("i1", "chickpeas", "1", "can"),
    ingredient("i2", "lemon"),
    ingredient("i3", "Greek yogurt", "1/2", "cup"),
  ],
  steps: [
    { instruction: "Drain the chickpeas and warm them in a pan with olive oil." },
    { instruction: "Stir lemon juice into the yogurt, then spoon over the chickpeas and greens." },
  ],
  updated_at: now,
};
const list = {
  id: "list-1",
  household_id: null,
  title: "This week’s groceries",
  status: "active",
  updated_at: now,
  items: [
    { id: "item-1", name: "Chickpeas", quantity: "2 cans", checked_at: null },
    { id: "item-2", name: "Greek yogurt", quantity: "1 tub", checked_at: null },
    { id: "item-3", name: "Lemons", quantity: "3", checked_at: now },
    {
      id: "item-4",
      name: "Extra-long grocery item name: organic baby spinach and mixed spring greens",
      quantity: "1 bag",
      checked_at: null,
    },
  ],
};
let households, lists, recipes;
let view;
const emptyGrocery = {
  shopping_list: [],
  cart: [],
  product_matches: [],
  meal_plan: "",
  status: "idle",
  recipe: null,
};
function initialize(next = "content") {
  scenario = next;
  const empty = next === "empty";
  households = empty
    ? []
    : [
        structuredClone(household),
        { ...household, id: "home-2", name: "Weekend cabin", role: "member" },
      ];
  lists = empty
    ? []
    : [
        structuredClone(list),
        {
          ...structuredClone(list),
          id: "list-2",
          household_id: "home-1",
          title: "Saturday breakfast",
        },
        {
          ...structuredClone(list),
          id: "list-3",
          household_id: "home-1",
          title: "Dinner with friends",
          items: [],
        },
      ];
  recipes = empty
    ? []
    : [
        structuredClone(recipe),
        {
          ...structuredClone(recipe),
          id: "recipe-2",
          title: "Roasted tomato pasta",
          household_id: "home-1",
          tags: ["Pasta"],
        },
      ];
  view = {
    revision: (view?.revision ?? 0) + 1,
    signedIn: next !== "signed-out",
    connected: next === "connected",
    running: false,
    error:
      next === "chat-error" ? "Couldn’t reach Grocery Agent. Your message is ready to retry." : "",
    activeThreadId: "thread-1",
    messages: empty
      ? []
      : [
          { id: "m1", role: "user", content: "Plan an easy dinner for two." },
          {
            id: "m2",
            role: "assistant",
            content:
              "## Lemony chickpea bowls\nA bright dinner for two, ready in about 20 minutes.\n\n- Warm chickpeas with olive oil.\n- Toss with greens and a lemon yogurt dressing.\n\nYour grocery list is ready to review below.",
          },
        ],
    grocery: empty
      ? emptyGrocery
      : {
          shopping_list: ["Chickpeas", "Greek yogurt", "Lemons"],
          list_title: "Easy dinners for two",
          meal_plan:
            "### Tonight\nLemony chickpea bowls.\n\n### Tomorrow\nRoasted tomato pasta with greens.",
          weekly_deals: "Check your store for current offers.",
          recipe: structuredClone(recipe),
          status: "ready",
          product_matches: [
            {
              query: "Chickpeas",
              name: "Kroger Chickpeas",
              upc: "111",
              price: 1.25,
              size: "15 oz",
            },
            {
              query: "Greek yogurt",
              name: "Plain Greek yogurt",
              upc: "222",
              price: 4.5,
              size: "32 oz",
            },
          ],
          cart: [],
          shopping_profile: { pantry: [{ name: "Olive oil", quantity: "1", category: "Pantry" }] },
        },
  };
  listeners.forEach((fn) => fn());
  if (client) void client.resetQueries();
}
initialize();
function publish(patch) {
  view = { ...view, ...patch, revision: view.revision + 1 };
  listeners.forEach((fn) => fn());
}
export function useReview() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => view,
  );
}
async function wait() {
  if (scenario === "loading") await new Promise((resolve) => setTimeout(resolve, 60000));
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (scenario === "error" || failNext) {
    failNext = false;
    throw new Error("Could not reach Grocery Agent. Check your connection and try again.");
  }
}
const getList = (id) => {
  const result = lists.find((item) => item.id === id);
  if (!result) throw new Error("This list is no longer available.");
  return result;
};
const api = {
  listHouseholds: async () => {
    await wait();
    return structuredClone(households);
  },
  listLists: async (id) => {
    await wait();
    return structuredClone(lists.filter((item) => (item.household_id || undefined) === id));
  },
  getList: async (id) => {
    await wait();
    return structuredClone(getList(id));
  },
  listRecipes: async (id) => {
    await wait();
    return structuredClone(recipes.filter((item) => (item.household_id || undefined) === id));
  },
  getRecipe: async (id) => {
    await wait();
    const result = recipes.find((item) => item.id === id);
    if (!result) throw new Error("Recipe not found.");
    return structuredClone(result);
  },
  updateList: async (id, patch) => {
    await wait();
    Object.assign(getList(id), patch);
    return structuredClone(getList(id));
  },
  addItems: async (id, items) => {
    await wait();
    const created = items.map((item, index) => ({
      quantity: "1",
      checked_at: null,
      ...item,
      id: `${Date.now()}-${index}`,
    }));
    getList(id).items.push(...created);
    return structuredClone(created);
  },
  updateItem: async (id, itemId, patch) => {
    await wait();
    const item = getList(id).items.find((item) => item.id === itemId);
    item.checked_at = patch.checked ? Date.now() : null;
    return structuredClone(item);
  },
  deleteItem: async (id, itemId) => {
    await wait();
    getList(id).items = getList(id).items.filter((item) => item.id !== itemId);
  },
  createList: async (title, householdId, items = []) => {
    await wait();
    const created = {
      id: `list-${Date.now()}`,
      household_id: householdId ?? null,
      title,
      status: "active",
      updated_at: now,
      items: items.map((item, i) => ({ ...item, id: `new-${i}`, checked_at: null })),
    };
    lists.unshift(created);
    return structuredClone(created);
  },
  createRecipe: async (content, householdId) => {
    await wait();
    const created = {
      ...content,
      id: `recipe-${Date.now()}`,
      household_id: householdId ?? null,
      updated_at: now,
      steps: content.steps.map((step) => (typeof step === "string" ? { instruction: step } : step)),
    };
    recipes.unshift(created);
    return structuredClone(created);
  },
  updateRecipe: async (id, content) => {
    await wait();
    const saved = recipes.find((item) => item.id === id);
    Object.assign(saved, content, { steps: content.steps.map((instruction) => ({ instruction })) });
    return structuredClone(saved);
  },
  createHousehold: async (name) => {
    await wait();
    const created = { ...household, id: `home-${Date.now()}`, name };
    households.push(created);
    return created;
  },
  joinHousehold: async () => {
    await wait();
    const created = {
      ...household,
      id: `join-${Date.now()}`,
      name: "Joined household",
      role: "member",
    };
    households.push(created);
    return created;
  },
  createInvite: async (householdId) => {
    await wait();
    return { code: "MAPLE123", household_id: householdId, expires_at: now + 604800000 };
  },
};
export function useHouseholdApi() {
  useReview();
  return { api, userId: "ui-review-user" };
}
export function useGroceryState() {
  return useReview().grocery;
}
export function useGroceryMessages() {
  const state = useReview();
  return { messages: state.messages, isStreaming: state.running };
}
const threads = Array.from({ length: 5 }, (_, i) => ({
  id: `thread-${i + 1}`,
  name: [
    "Easy dinners for two",
    "A week of lunches under $50",
    "Weekend brunch with friends",
    "Vegetarian meals",
    "Pantry restock",
  ][i],
  updatedAt: new Date(now - i * 86400000).toISOString(),
}));
export function useGroceryAgent() {
  const state = useReview();
  const send = async (content) => {
    publish({
      running: true,
      error: "",
      messages: [...view.messages, { id: `m-${Date.now()}`, role: "user", content }],
    });
    try {
      await wait();
      publish({ running: false });
      return { status: "success" };
    } catch {
      publish({ running: false, error: "Couldn’t send your message. Try again." });
      return { status: "failed" };
    }
  };
  return {
    ...state,
    isRunning: state.running,
    failedInput: state.error ? "Plan dinner" : null,
    clearError: () => publish({ error: "" }),
    retry: () => send("Plan dinner"),
    send,
    stop: async () => {
      publish({ running: false });
      return { status: "stopped" };
    },
    startNewChat: async () => {
      publish({ messages: [], grocery: emptyGrocery });
      return { status: "success" };
    },
    openThread: async (id) => {
      publish({ activeThreadId: id });
      return { status: "success" };
    },
    threads: scenario === "empty" ? [] : threads,
    threadsLoading: scenario === "loading",
    threadsError: scenario === "error" ? new Error("Offline") : null,
    fetchMoreThreadsError: null,
    hasMoreThreads: false,
    isFetchingMoreThreads: false,
    refetchThreads: () => {},
    fetchMoreThreads: () => {},
  };
}
export function useKrogerConnection() {
  const state = useReview();
  return {
    connected: state.connected,
    isLoading: false,
    error: "",
    connect: async () => {
      publish({ connected: true });
    },
    reconnect: async () => {},
    refresh: async () => {},
    clearError: () => {},
  };
}
export function GroceryCopilotSession({ children }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    client = queryClient;
    queryClient.setDefaultOptions({
      queries: { retry: false, staleTime: 1000 },
      mutations: { retry: false },
    });
    return () => {
      client = undefined;
    };
  }, [queryClient]);
  return children;
}
export const GroceryAgentProvider = ({ children }) => children;
export const reviewUser = {
  id: "ui-review-user",
  firstName: "Alex",
  fullName: "Alex Morgan",
  primaryEmailAddress: { emailAddress: "alex@example.test" },
  externalAccounts: [],
  reload: async () => reviewUser,
};
globalThis.__groceryReview = {
  scenario: initialize,
  failNext: () => {
    failNext = true;
  },
  snapshot: () => ({ scenario, lists, households, recipes }),
};
