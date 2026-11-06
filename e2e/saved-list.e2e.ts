import { createServer } from "node:http";
import { once } from "node:events";
import { afterAll, beforeAll, expect } from "e2e";
import { test } from "@e2e-dev/mobile";

// Real saved-list screen, RHF, Query and openapi-fetch; only Clerk identity and
// the remote service are controlled. No external accounts or production writes.
const list = {
  id: "fixture",
  title: "Weekly groceries",
  household_id: null,
  items: [] as { id: string; name: string; quantity: number; checked_at: number | null }[],
  status: "active",
  updated_at: 1,
};
let titleAttempts = 0;
let addAttempts = 0;
const server = createServer(async (request, response) => {
  if (
    request.headers.authorization !== "Bearer fixture-token" ||
    request.headers["x-clerk-user-id"] !== "fixture-user"
  ) {
    response.writeHead(401).end();
    return;
  }
  let raw = "";
  for await (const chunk of request) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  response.setHeader("Content-Type", "application/json");
  if (request.method === "PATCH" && request.url === "/api/grocery/lists/fixture") {
    titleAttempts++;
    await new Promise((resolve) => setTimeout(resolve, 10000));
    if (titleAttempts === 1) {
      response.writeHead(503).end(JSON.stringify({ error: "fixture_failure" }));
      return;
    }
    list.title = body.title;
  }
  if (request.method === "POST" && request.url === "/api/grocery/lists/fixture/items") {
    addAttempts++;
    list.items.push({ id: "milk", name: body.items[0].name, quantity: 1, checked_at: null });
    response.end(JSON.stringify(list.items));
    return;
  }
  response.end(JSON.stringify(list));
});

beforeAll(async () => {
  server.listen(8855, "127.0.0.1");
  await once(server, "listening");
});
afterAll(async () => {
  server.close();
  await once(server, "close");
});

test("failed save retains the draft; retry persists it and items survive reopening", async ({
  app,
  screen,
  device,
}) => {
  await device.setAppearance("dark");
  await app.open();
  await screen.getByRole("button", "Open fixture list").tap();
  const title = screen.getByLabel("Grocery list title");
  await expect(title).toHaveValue("Weekly groceries");
  await title.fill("Weekend supplies");
  await screen.getByRole("button", "Save list title").tap();
  await expect(title).toBeDisabled();
  await expect(screen.getByText("The shared list request failed. Try again.")).toBeVisible();
  await expect(title).toHaveValue("Weekend supplies");
  await expect(title).toBeEnabled();
  await screen.getByRole("button", "Save list title").tap();
  await expect(screen.getByRole("button", "Open fixture list")).toBeVisible();
  await screen.getByRole("button", "Open fixture list").tap();
  await expect(title).toHaveValue("Weekend supplies");
  const item = screen.getByLabel("New grocery item");
  await item.fill("Milk");
  await screen.getByRole("button", "Add grocery item").tap();
  await expect(screen.getByText("Milk")).toBeVisible();
  await expect(item).toHaveValue("");
  await device.dismissKeyboard();
  await device.back();
  await screen.getByRole("button", "Open fixture list").tap();
  await expect(screen.getByText("Milk")).toBeVisible();
  expect(titleAttempts).toBe(2);
  expect(addAttempts).toBe(1);
  expect(list.items.map((entry) => entry.name)).toEqual(["Milk"]);
});
