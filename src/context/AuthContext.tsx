"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import {
  getFirebaseMessagingToken,
  subscribeToForegroundMessages,
} from "../services/firebaseMessaging";
import { supabase, clearSupabaseSession } from "../services/supabaseClient";
import {
  notificationStorage,
  mapFirebasePayloadToNotification,
} from "../services/notificationStorage";
import Modal from "../components/Modal/Modal";
import { sileo } from "sileo";
import "./AuthContext.css";

type SessionStatus = {
  status?: boolean | string;
  is_professional?: boolean;
  professional_active?: boolean;
  has_professional_address?: boolean;
  profile_province_id?: number | null;
  full_name?: string;
  has_days_left?: boolean;
  user_created_at?: string;
  user_last_sign_in_at?: string;
  user_id?: string | null;
  email?: string | null;
  display_name?: string | null;
  company_name?: string | null;
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
  hasAddress: boolean;
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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
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

  const professionalPlanActive =
    sessionStatus?.subscription?.plan === "professional" &&
    (sessionStatus?.subscription?.status === "active" || hasActiveStatusFlag);

  const hasAddress = Boolean(sessionStatus?.has_professional_address);

  const subscriptionPlan = sessionStatus?.subscription?.plan ?? null;

  const refreshSession = async () => {
    try {
      // 1. Check if the Supabase client has an active session (e.g. from OAuth redirect)
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession();

      if (supabaseSession) {
        try {
          // Try to get NestJS session
          const session = await authService.getSession();
          const { nextUser, nextSessionStatus } =
            normalizeSessionPayload(session);
          setUser(nextUser);
          if (nextSessionStatus !== null) {
            setSessionStatus(nextSessionStatus);
          }
          setLoading(false);
          return;
        } catch (apiErr) {
          // If NestJS is not authenticated, sync the Supabase session
          console.log("Syncing Supabase OAuth session with NestJS API...");
          try {
            const syncResponse = await authService.syncOAuth({
              access_token: supabaseSession.access_token,
              refresh_token: supabaseSession.refresh_token || "",
            });
            const { nextUser, nextSessionStatus } =
              normalizeSessionPayload(syncResponse);
            setUser(nextUser);
            if (nextSessionStatus !== null) {
              setSessionStatus(nextSessionStatus);
            }
            setLoading(false);
            return;
          } catch (syncErr) {
            console.error("Failed to sync Supabase OAuth session:", syncErr);
          }
        }
      }

      // 2. Default flow
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

  useEffect(() => {
    if (user) {
      localStorage.setItem("was_logged_in", "true");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      try {
        const token = localStorage.getItem("access_token") || "";
        const sseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}/api/notifications/stream?token=${token}`;

        if (eventSource) {
          eventSource.close();
        }

        eventSource = new EventSource(sseUrl, { withCredentials: true });

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);

            // Ignorar los eventos de tipo ping que mantienen viva la conexión
            if (payload.type === "ping") {
              return;
            }

            console.log("¡Nueva notificación recibida en vivo!", payload);

            // Inyectar en React Query caché (para la NavBar y NotificationsPage)
            queryClient.setQueryData(
              ["notifications", user.id],
              (old: any[]) => {
                if (!old) return [payload];
                return [payload, ...old];
              },
            );

            // Mostrar la notificación flotante con sileo
            sileo.info({
              title: payload.title || "Nueva Notificación",
              description:
                payload.content ||
                payload.message ||
                "Tienes una nueva notificación",
            });
          } catch (e) {
            console.error("Error al procesar la notificación en vivo:", e);
          }
        };

        eventSource.onerror = () => {
          console.warn(
            "Stream de notificaciones desconectado temporalmente. Reintentando en breve...",
          );
          // Si hay error, cerrarlo para evitar ciclos infinitos si el auth falló
          eventSource?.close();

          // Volver a intentar conectarse cada 6 segundos
          reconnectTimeout = setTimeout(() => {
            connectSSE();
          }, 6000);
        };
      } catch (e) {
        console.error("Error inicializando SSE:", e);
        reconnectTimeout = setTimeout(() => {
          connectSSE();
        }, 6000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [user]);

  // Keep Supabase session alive and listen to auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Supabase auth event: ${event}`);
      if (event === "SIGNED_OUT") {
        console.log("Supabase session cleared");
      }
    });

    // Periodically call getSession to trigger auto-refresh of Supabase tokens
    const interval = setInterval(
      async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            console.log("Supabase session verified / auto-refreshed");
          }
        } catch (err) {
          console.error("Error refreshing Supabase session:", err);
        }
      },
      1000 * 60 * 10,
    ); // Every 10 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const [showChatSyncModal, setShowChatSyncModal] = useState(false);

  // Handle Chat DB login after returning from backend Google OAuth globally
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("auth") === "success") {
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) {
            console.log("Mostrando modal de sincronización de Chat DB...");
            setShowChatSyncModal(true);
          } else {
            // Remove auth=success from URL to clean it up
            urlParams.delete("auth");
            const newSearch = urlParams.toString();
            const newUrl =
              window.location.pathname + (newSearch ? `?${newSearch}` : "");
            window.history.replaceState({}, document.title, newUrl);
          }
        });
      }
    }
  }, []);

  const handleChatSyncConfirm = () => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          window.location.origin +
          window.location.pathname +
          window.location.search,
      },
    });
  };

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

    const setupForegroundNotifications = async () => {
      unsubscribe = await subscribeToForegroundMessages((payload: any) => {
        const title = payload?.notification?.title || "Nueva notificacion";
        const body = payload?.notification?.body || "Tenes un nuevo mensaje.";

        // Map and save to local storage notifications list
        const mapped = mapFirebasePayloadToNotification(payload);
        notificationStorage.addNotification(mapped);

        sileo.info({ title, description: body });

        if (
          typeof window !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification(title, { body });
        }
      });
    };

    setupForegroundNotifications();

    const handleSessionExpired = () => {
      setUser(null);
      setSessionStatus(null);
    };
    window.addEventListener("session-expired", handleSessionExpired);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener("session-expired", handleSessionExpired);
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

    try {
      await authService.logout();
    } catch (error) {
      // Ignore errors on logout
    }

    localStorage.removeItem("registered_device_token");
    localStorage.removeItem("was_logged_in");

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
        hasAddress,
        subscriptionPlan,
        loading,
        refreshSession,
        logout,
        setUser,
        setSessionStatus,
      }}
    >
      {children}
      <Modal
        isOpen={showChatSyncModal}
        title="Sincronización de Chat"
        onClose={() => setShowChatSyncModal(false)}
      >
        <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
          Acepta iniciar sesión para sincronizar tu cuenta con el chat en vivo y
          notificaciones.
        </p>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <button
            className="btn-secondary"
            style={{
              margin: 0,
              color: "var(--error-color)",
              borderColor: "var(--error-color)",
            }}
            onClick={() => setShowChatSyncModal(false)}
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            style={{ margin: 0 }}
            onClick={handleChatSyncConfirm}
          >
            Aceptar
          </button>
        </div>
      </Modal>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
