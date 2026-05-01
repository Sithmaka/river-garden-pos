/**
 * Theme Context
 *
 * Provides dynamic theme management based on user role.
 */

import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { role } = useAuth();

  const value = useMemo(() => {
    let theme = null;

    if (role === "admin") theme = "admin";
    if (role === "cashier") theme = "cashier";

    return {
      theme,
      isAdmin: theme === "admin",
      isCashier: theme === "cashier",
    };
  }, [role]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}