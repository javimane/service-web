"use client";
import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

const ThemeContext = createContext<string>("light");

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeContext.Provider value="light">
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return { theme: context, toggleTheme: () => {} };
};
