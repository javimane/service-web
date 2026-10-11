import { userService } from "./userService";
import { getFirebaseMessagingToken } from "./firebaseMessaging";

export type DesktopNotificationStatus = "enabled" | "browser-only" | "blocked" | "unsupported";

type IncomingNotification = {
  id?: string | number;
  type?: string;
  title?: string;
  content?: string;
  message?: string;
  body?: string;
  data?: Record<string, string | undefined>;
  notification?: { title?: string; body?: string };
};

const recentNotifications = new Map<string, number>();

export function desktopNotificationUrl(payload: IncomingNotification): string {
  const requestedUrl = payload.data?.url;
  if (requestedUrl && requestedUrl.startsWith("/") && !requestedUrl.startsWith("//")) {
    return requestedUrl;
  }

  switch (payload.type ?? payload.data?.type) {
    case "message":
      return "/mensajes";
    case "proposal":
    case "propossal":
      return "/panel?view=proposals-view";
    case "promotion":
      return "/panel?view=promotions-all";
    default:
      return "/panel?view=notifications";
  }
}

export function showDesktopNotification(payload: IncomingNotification): boolean {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  // El service worker muestra el push cuando la pestaña queda en segundo plano.
  if (document.visibilityState === "hidden" && localStorage.getItem("registered_device_token")) {
    return false;
  }

  const title = payload.title ?? payload.notification?.title ?? payload.data?.title ?? "Nueva notificación";
  const body = payload.content ?? payload.message ?? payload.body ?? payload.notification?.body ?? payload.data?.body ?? "";
  const key = String(payload.id ?? payload.data?.notificationId ?? payload.data?.notification_id ?? `${title}:${body}`);
  const contentKey = `${title}:${body}`;
  const now = Date.now();
  for (const [oldKey, timestamp] of recentNotifications) {
    if (now - timestamp > 10_000) recentNotifications.delete(oldKey);
  }
  if (recentNotifications.has(key) || recentNotifications.has(contentKey)) return false;

  try {
    const notification = new Notification(title, { body, icon: "/favicon.svg", tag: key });
    recentNotifications.set(key, now);
    recentNotifications.set(contentKey, now);
    notification.onclick = () => {
      window.focus();
      window.location.assign(desktopNotificationUrl(payload));
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}

export async function enableDesktopNotifications(): Promise<DesktopNotificationStatus> {
  if (typeof window === "undefined" || !("Notification" in window) || !window.isSecureContext) {
    return "unsupported";
  }

  // El permiso debe solicitarse directamente desde el clic del usuario.
  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission !== "granted") return "blocked";

  try {
    const token = await getFirebaseMessagingToken(false);
    if (!token) return "browser-only";
    await userService.registerDeviceToken(token, "web");
    localStorage.setItem("firebase_token", token);
    localStorage.setItem("registered_device_token", token);
    return "enabled";
  } catch {
    return "browser-only";
  }
}
