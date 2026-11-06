export type CollectionScope = "all" | "personal" | "household";
export type CollectionSort = "recent" | "title";
export type SavedResource<T> = { resource: T; location: string };

type Collectable = { title: string; updated_at: number; household_id?: string | null };

export function filterCollection<T extends Collectable>(
  resources: SavedResource<T>[],
  search: string,
  scope: CollectionScope,
  sort: CollectionSort,
  extraText?: (resource: T) => string,
): SavedResource<T>[] {
  const query = search.trim().toLocaleLowerCase();
  return resources
    .filter(({ resource, location }) => {
      const matchesScope =
        scope === "all" ||
        (scope === "household" ? Boolean(resource.household_id) : !resource.household_id);
      return (
        matchesScope &&
        `${resource.title} ${location} ${extraText?.(resource) ?? ""}`
          .toLocaleLowerCase()
          .includes(query)
      );
    })
    .sort((a, b) =>
      sort === "title"
        ? a.resource.title.localeCompare(b.resource.title)
        : b.resource.updated_at - a.resource.updated_at,
    );
}

export function updatedLabel(value: number) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Saved"
    : `Updated ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
