"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import {
  getFirebaseMessagingToken,
  subscribeToForegroundMessages,
} from "../services/firebaseMessaging";
import { clearSupabaseSession } from "../services/supabaseClient";
import {
  notificationStorage,
  mapFirebasePayloadToNotification,
} from "../services/notificationStorage";
import "./AuthContext.css";

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
  professionalPlanActive: boolean;
  subscriptionPlan: string | null;
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
  const [foregroundNotification, setForegroundNotification] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const hasActiveStatusFlag =
    sessionStatus?.status === true || sessionStatus?.status === "active";

  const hasProfessionalSubscription = Boolean(
    sessionStatus?.is_professional &&
    (sessionStatus?.professional_active ||
      sessionStatus?.subscription?.status === "active" ||
      hasActiveStatusFlag),
  );

  const professionalPlanActive =
    sessionStatus?.subscription?.plan === "professional" &&
    (sessionStatus?.subscription?.status === "active" || hasActiveStatusFlag);

  const subscriptionPlan = sessionStatus?.subscription?.plan ?? null;

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

  useEffect(() => {
    const registerDeviceTokenIfPresent = async () => {
      if (!user || typeof window === "undefined") return;

      // Ask browser permission and fetch token from Firebase when possible.
      const firebaseToken = await getFirebaseMessagingToken(true);
      if (firebaseToken) {
        localStorage.setItem("firebase_token", firebaseToken);
      }

      const tokenKeys = [
        "firebase_token",
        "fcm_token",
        "firebaseMessagingToken",
      ];
      const token = tokenKeys
        .map((key) => localStorage.getItem(key))
        .find((value): value is string => Boolean(value));

      if (!token) return;

      const lastRegistered = localStorage.getItem("registered_device_token");
      if (lastRegistered === token) return;

      try {
        await userService.registerDeviceToken(token, "web");
        localStorage.setItem("registered_device_token", token);
      } catch (error) {
        // Silent fail: app auth flow should not break if notifications fail.
      }
    };

    registerDeviceTokenIfPresent();
  }, [user]);

  useEffect(() => {
    let unsubscribe: undefined | (() => void);
    let clearToastTimer: ReturnType<typeof setTimeout> | undefined;

    const setupForegroundNotifications = async () => {
      unsubscribe = await subscribeToForegroundMessages((payload: any) => {
        const title = payload?.notification?.title || "Nueva notificacion";
        const body = payload?.notification?.body || "Tenes un nuevo mensaje.";

        // Map and save to local storage notifications list
        const mapped = mapFirebasePayloadToNotification(payload);
        notificationStorage.addNotification(mapped);

        setForegroundNotification({ title, body });
        if (clearToastTimer) {
          clearTimeout(clearToastTimer);
        }
        clearToastTimer = setTimeout(() => {
          setForegroundNotification(null);
        }, 5000);

        if (
          typeof window !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification(title, { body });
        }
      });
    };

    setupForegroundNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
      if (clearToastTimer) clearTimeout(clearToastTimer);
    };
  }, []);

  const logout = async () => {
    if (typeof window !== "undefined") {
      const tokenKeys = [
        "firebase_token",
        "fcm_token",
        "firebaseMessagingToken",
      ];
      const deviceToken = tokenKeys
        .map((key) => localStorage.getItem(key))
        .find((value): value is string => Boolean(value));

      if (deviceToken) {
        try {
          await userService.removeDeviceToken(deviceToken);
        } catch (error) {
          // Silent fail on logout.
        }
      }
    }

    // If there's an API logout endpoint, we'd call it here
    // await apiClient('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("registered_device_token");

    // Clear Supabase Session for chat functionality
    await clearSupabaseSession();

    setUser(null);
    setSessionStatus(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionStatus,
        hasProfessionalSubscription,
        professionalPlanActive,
        subscriptionPlan,
        loading,
        refreshSession,
        logout,
        setUser,
        setSessionStatus,
      }}
    >
      {children}
      {foregroundNotification && (
        <div className="foreground-notification" role="status" aria-live="polite">
          <div className="foreground-notification__title">
            {foregroundNotification.title}
          </div>
          <div className="foreground-notification__body">
            {foregroundNotification.body}
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
