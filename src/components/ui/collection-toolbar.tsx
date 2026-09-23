import { Search, X, ArrowDownWideNarrow } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";

export type CollectionScope = "all" | "personal" | "household";
export type CollectionSort = "recent" | "title";

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View className="flex-row items-center rounded-xl border border-input bg-card pl-4">
      <Icon as={Search} className="size-5 text-muted-foreground" />
      <Input
        testID="collection-search"
        variant="ghost"
        className="min-w-0 flex-1"
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value ? (
        <Button
          accessibilityLabel="Clear search"
          variant="ghost"
          size="icon"
          onPress={() => onChange("")}
          icon={<Icon as={X} className="size-5 text-muted-foreground" />}
        />
      ) : null}
    </View>
  );
}

export function CollectionToolbar({
  search,
  onSearch,
  scope,
  onScope,
  sort,
  onSort,
  placeholder,
}: {
  search: string;
  onSearch: (value: string) => void;
  scope: CollectionScope;
  onScope: (value: CollectionScope) => void;
  sort: CollectionSort;
  onSort: (value: CollectionSort) => void;
  placeholder: string;
}) {
  return (
    <View className="gap-3">
      <SearchField value={search} onChange={onSearch} placeholder={placeholder} />
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Show saved resources"
        className="flex-row flex-wrap gap-2"
      >
        {(
          [
            ["all", "All"],
            ["personal", "Personal"],
            ["household", "Household"],
          ] as const
        ).map(([value, label]) => (
          <Chip
            key={value}
            selected={scope === value}
            accessibilityRole="radio"
            accessibilityState={{ checked: scope === value }}
            onPress={() => onScope(value)}
          >
            {label}
          </Chip>
        ))}
      </View>
      <Button
        className="self-start"
        variant="ghost"
        size="sm"
        accessibilityLabel={`Sort: ${sort === "recent" ? "recently updated" : "A to Z"}. Change sort order`}
        onPress={() => onSort(sort === "recent" ? "title" : "recent")}
        icon={<Icon as={ArrowDownWideNarrow} className="size-4 text-primary" />}
      >
        {sort === "recent" ? "Recently updated" : "A to Z"}
      </Button>
    </View>
  );
}
