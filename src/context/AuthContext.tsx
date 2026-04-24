import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext<any>(null);

const normalizeSessionPayload = (payload: any) => {
  const data = payload?.data ?? payload ?? null;

  const nextUser =
    data?.user ??
    data?.session?.user ??
    payload?.user ??
    payload?.session?.user ??
    null;

  const nextSessionStatus =
    payload?.sessionStatus ?? data?.sessionStatus ?? null;

  return {
    nextUser,
    nextSessionStatus,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const hasActiveStatusFlag =
    sessionStatus?.status === true || sessionStatus?.status === "active";

  const hasProfessionalSubscription = Boolean(
    sessionStatus?.is_professional &&
    (sessionStatus?.professional_active ||
      sessionStatus?.subscription?.status === "active" ||
      hasActiveStatusFlag),
  );

  const refreshSession = async () => {
    try {
      const session = await authService.getSession();
      const { nextUser, nextSessionStatus } = normalizeSessionPayload(session);
      setUser(nextUser);
      if (nextSessionStatus !== null) {
        setSessionStatus(nextSessionStatus);
      }
    } catch (err) {
      setUser(null);
      setSessionStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const logout = async () => {
    try {
      // If there's an API logout endpoint, we'd call it here
      // await apiClient('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setUser(null);
    setSessionStatus(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionStatus,
        hasProfessionalSubscription,
        loading,
        refreshSession,
        logout,
        setUser,
        setSessionStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
