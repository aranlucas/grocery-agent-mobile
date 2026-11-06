import { expect, test } from "vitest";
import { cartSubtotal, normalizeGroceryState } from "../src/lib/grocery-state";

test.each([null, "3.50", {}, NaN, Infinity])(
  "malformed cart price %j cannot reach currency rendering",
  (price) => {
    const state = normalizeGroceryState({
      cart: [
        { name: "Milk", quantity: 2, price },
        { name: "Eggs", quantity: 1, price: 4.5 },
      ],
    });
    expect(state.cart).toEqual([{ name: "Eggs", quantity: 1, price: 4.5 }]);
    expect(state.cart.map((item) => item.price?.toFixed(2))).toEqual(["4.50"]);
    expect(cartSubtotal(state.cart)).toBe(4.5);
  },
);

test("valid priced and unpriced cart items retain quantities and totals", () => {
  const cart = [
    { name: "Milk", quantity: 2, price: 3.5 },
    { name: "Eggs", quantity: 1 },
  ];
  expect(normalizeGroceryState({ cart }).cart).toEqual(cart);
  expect(cartSubtotal(cart)).toBe(7);
});
