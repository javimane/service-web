"use client";
import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from "react";

type ThemeContextValue = {
  theme: string;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme] = useState<string>("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  const toggleTheme = () => {
    // Modo oscuro eliminado
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
};
