import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Appearance, useColorScheme as useNativeColorScheme, View } from "react-native";
import { cn } from "@/lib/utils";
import { useCSSVariable } from "uniwind";

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const nativeColors = {
  background: ["--color-background", "#f7f8f2"],
  foreground: ["--color-foreground", "#17201a"],
  card: ["--color-card", "#ffffff"],
  cardForeground: ["--color-card-foreground", "#17201a"],
  primary: ["--color-primary", "#15803d"],
  primaryForeground: ["--color-primary-foreground", "#ffffff"],
  secondary: ["--color-secondary", "#14532d"],
  secondaryForeground: ["--color-secondary-foreground", "#f7f8f2"],
  muted: ["--color-muted", "#eef2e8"],
  mutedForeground: ["--color-muted-foreground", "#667067"],
  accent: ["--color-accent", "#d9f99d"],
  accentForeground: ["--color-accent-foreground", "#17201a"],
  destructive: ["--color-destructive", "#b42318"],
  destructiveForeground: ["--color-destructive-foreground", "#ffffff"],
  border: ["--color-border", "#dfe5dc"],
  input: ["--color-input", "#dfe5dc"],
  ring: ["--color-ring", "#15803d"],
} as const;

const colorEntries = Object.entries(nativeColors);
const colorVariables = colorEntries.map(([, [variable]]) => variable);

/** AniUI's native color API, backed by the same Uniwind tokens as className. */
export function useThemeColors() {
  const values = useCSSVariable(colorVariables);
  return Object.fromEntries(
    colorEntries.map(([name, [, fallback]], index) => [
      name,
      typeof values[index] === "string" ? values[index] : fallback,
    ]),
  ) as Record<keyof typeof nativeColors, string>;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  className?: string;
}

// Try to detect and use Uniwind's setTheme if available
let uniwindSetTheme: ((theme: string) => void) | null = null;
try {
  const mod = require("uniwind");
  if (mod?.Uniwind?.setTheme) {
    uniwindSetTheme = (theme: string) => mod.Uniwind.setTheme(theme);
  }
} catch {}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  className,
}: ThemeProviderProps) {
  const systemScheme = useNativeColorScheme();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const resolvedSystemTheme: "light" | "dark" = systemScheme === "dark" ? "dark" : "light";

  const resolvedTheme: "light" | "dark" = theme === "system" ? resolvedSystemTheme : theme;

  const applyTheme = useCallback((resolved: "light" | "dark") => {
    if (uniwindSetTheme) {
      // Uniwind handles Appearance.setColorScheme internally
      uniwindSetTheme(resolved);
    } else {
      // NativeWind v4/v5: set system appearance directly
      try {
        Appearance.setColorScheme(resolved);
      } catch {}
    }
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      const resolved = newTheme === "system" ? resolvedSystemTheme : newTheme;
      applyTheme(resolved);
    },
    [resolvedSystemTheme, applyTheme],
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const current = prev === "system" ? resolvedSystemTheme : prev;
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, [resolvedSystemTheme, applyTheme]);

  // Apply initial theme
  useEffect(() => {
    if (defaultTheme !== "system") {
      applyTheme(defaultTheme === "dark" ? "dark" : "light");
    }
  }, [defaultTheme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      <View
        className={cn(resolvedTheme === "dark" ? "dark" : "", "flex-1 bg-background", className)}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
}
