import assert from "node:assert/strict";
import { test } from "node:test";
import { filterCollection } from "../src/lib/collection.ts";
const rows = [
  {
    resource: {
      id: "p",
      title: "Pasta night",
      updated_at: 10,
      household_id: null,
      tags: ["Vegetarian"],
    },
    location: "Personal",
  },
  {
    resource: { id: "h", title: "Apples and oats", updated_at: 30, household_id: "h1", tags: [] },
    location: "Maple House",
  },
  {
    resource: {
      id: "h2",
      title: "Weekend brunch",
      updated_at: 20,
      household_id: "h2",
      tags: ["Breakfast"],
    },
    location: "Personal",
  },
];
void test("scope uses ownership, even when a household is named Personal", () => {
  assert.deepEqual(
    filterCollection(rows, "", "personal", "recent").map(({ resource }) => resource.id),
    ["p"],
  );
  assert.deepEqual(
    filterCollection(rows, "", "household", "recent").map(({ resource }) => resource.id),
    ["h", "h2"],
  );
});
void test("search supports case, whitespace, location, and recipe tags", () => {
  assert.equal(filterCollection(rows, "  MAPLE  ", "all", "recent")[0].resource.id, "h");
  assert.equal(
    filterCollection(rows, "vegetarian", "all", "title", (item) => item.tags.join(" "))[0].resource
      .id,
    "p",
  );
  assert.deepEqual(filterCollection(rows, "missing", "all", "recent"), []);
});
void test("sorts numerically by timestamps or alphabetically without changing cached data", () => {
  assert.deepEqual(
    filterCollection(rows, "", "all", "recent").map(({ resource }) => resource.id),
    ["h", "h2", "p"],
  );
  assert.deepEqual(
    filterCollection(rows, "", "all", "title").map(({ resource }) => resource.id),
    ["h", "p", "h2"],
  );
  assert.deepEqual(
    rows.map(({ resource }) => resource.id),
    ["p", "h", "h2"],
  );
});
