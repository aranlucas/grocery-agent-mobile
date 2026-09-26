// Grocery agent contract types, trimmed from the agents gateway contract generator.

export type CartItem = {
  name: string;
  quantity: number;
  price?: number;
  upc?: string;
};

export type ProductMatch = {
  query: string;
  name: string;
  upc: string;
  image_url?: string;
  price?: number;
  size?: string;
};

export type ShoppingPantryItem = {
  name: string;
  quantity: number;
  added_at: number;
  expires_at?: number;
};

export type ShoppingEquipmentItem = {
  name: string;
  added_at: number;
  category?: string;
};

export type ShoppingOrderItem = {
  upc: string;
  name: string;
  quantity: number;
  price?: number;
};

export type ShoppingOrder = {
  id: string;
  items: ShoppingOrderItem[];
  total_items: number;
  placed_at: number;
  estimated_total?: number;
  location_id?: string;
  notes?: string;
};

export type ShoppingPreferredStore = {
  location_id: string;
  name: string;
  address: string;
  chain: string;
  set_at: number;
};

export type ShoppingFrequentItem = {
  name: string;
  upc: string;
  orders: number;
  total_quantity: number;
};

export type ShoppingProfile = {
  pantry: ShoppingPantryItem[];
  equipment: ShoppingEquipmentItem[];
  recent_orders: ShoppingOrder[];
  frequent_items: ShoppingFrequentItem[];
  preferred_store?: ShoppingPreferredStore;
};

export type RecipeDraftIngredient = {
  name: string;
  quantity: string;
  unit: string;
  note: string;
};

export type RecipeDraft = {
  title: string;
  description: string;
  servings: string;
  notes: string;
  ingredients: RecipeDraftIngredient[];
  steps: string[];
  tags: string[];
};

export type GroceryState = {
  shopping_list?: string[];
  list_title?: string;
  product_matches?: ProductMatch[];
  cart?: CartItem[];
  shopping_profile?: ShoppingProfile;
  meal_plan?: string;
  recipe?: RecipeDraft;
  weekly_deals?: string;
  status?: "idle" | "planning" | "ready";
  notes?: string;
  review_summary?: string;
  kroger_connected?: boolean;
};
