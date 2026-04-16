import { createContext, useContext, useState, useCallback } from "react";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [authMode, setAuthMode] = useState(null); // null | 'login' | 'register'

  const openAuth = useCallback((mode) => setAuthMode(mode), []);
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
