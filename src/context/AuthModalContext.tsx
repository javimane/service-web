"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type AuthMode = "login" | "register";

type AuthModalContextValue = {
  authMode: AuthMode | null;
  openAuth: (mode: AuthMode) => void;
  closeAuth: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  const openAuth = useCallback((mode: AuthMode) => setAuthMode(mode), []);
  const closeAuth = useCallback(() => setAuthMode(null), []);

  return (
    <AuthModalContext.Provider value={{ authMode, openAuth, closeAuth }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx)
    throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
