import { setThemeServerFn, type Theme } from "@/lib/theme";
import { useRouter } from "@tanstack/react-router";
import { createContext, use, useCallback, useEffect } from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
  theme: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  theme,
  ...props
}: ThemeProviderProps) {
  const router = useRouter();

  const setTheme = useCallback(
    (data: Theme) => {
      setThemeServerFn({ data }).then(() => router.invalidate());
    },
    [router],
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = use(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
