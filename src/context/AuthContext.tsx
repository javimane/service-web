"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authService } from "../services/authService";

type SessionStatus = {
  status?: boolean | string;
  is_professional?: boolean;
  professional_active?: boolean;
  full_name?: string;
  email?: string;
  subscription?: {
    status?: string;
    professional_id?: number | string;
    plan?: string;
    started_at?: string;
    expires_at?: string;
    amount_paid?: number;
  } | null;
  [key: string]: any;
};

type AuthContextValue = {
  user: any;
  sessionStatus: SessionStatus | null;
  hasProfessionalSubscription: boolean;
  loading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (value: any) => void;
  setSessionStatus: (value: SessionStatus | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(
    null,
  );
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
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      setUser(null);
      setSessionStatus(null);
      return;
    }

    try {
      const session = await authService.getSession();
      const { nextUser, nextSessionStatus } = normalizeSessionPayload(session);
      setUser(nextUser);
      if (nextSessionStatus !== null) {
        setSessionStatus(nextSessionStatus);
      }
    } catch (err) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
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
    // If there's an API logout endpoint, we'd call it here
    // await apiClient('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
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
