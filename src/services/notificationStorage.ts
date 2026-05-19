"use client";

export interface NotificationItem {
  id: string | number;
  category: string;
  title: string;
  description: string;
  time: string;
  date: string;
  unread: boolean;
  iconColor?: string;
}

const STORAGE_KEY = "sercio_notifications";

const listeners = new Set<(notifications: NotificationItem[]) => void>();

function getIsClient() {
  return typeof window !== "undefined";
}

export const notificationStorage = {
  getNotifications(): NotificationItem[] {
    if (!getIsClient()) return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  saveNotifications(notifs: NotificationItem[]) {
    if (!getIsClient()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    listeners.forEach((cb) => cb(notifs));
  },

  addNotification(notif: Partial<NotificationItem>) {
    const list = this.getNotifications();
    const newItem: NotificationItem = {
      id: notif.id || Date.now(),
      category: notif.category || "all",
      title: notif.title || "Nueva notificación",
      description: notif.description || "",
      time: notif.time || "Ahora",
      date: notif.date || "Hoy",
      unread: notif.unread !== undefined ? notif.unread : true,
      iconColor: notif.iconColor || "blue",
    };
    const updated = [newItem, ...list];
    this.saveNotifications(updated);
    return newItem;
  },

  markAllAsRead() {
    const list = this.getNotifications();
    const updated = list.map((n) => ({ ...n, unread: false }));
    this.saveNotifications(updated);
  },

  markAsRead(id: string | number) {
    const list = this.getNotifications();
    const updated = list.map((n) =>
      n.id === id ? { ...n, unread: false } : n,
    );
    this.saveNotifications(updated);
  },

  subscribe(callback: (notifications: NotificationItem[]) => void) {
    listeners.add(callback);
    // Initial call
    callback(this.getNotifications());
    return () => {
      listeners.delete(callback);
    };
  },
};

export function mapFirebasePayloadToNotification(
  payload: any,
): Partial<NotificationItem> {
  const title =
    payload?.notification?.title ||
    payload?.data?.title ||
    "Nueva Notificación";
  const body =
    payload?.notification?.body ||
    payload?.data?.body ||
    payload?.data?.description ||
    "";
  const category = payload?.data?.category || "all";

  let iconColor = "blue";
  if (category === "messages") iconColor = "green";
  else if (category === "promotions") iconColor = "orange";
  else if (category === "analytics") iconColor = "purple";
  else if (category === "reviews") iconColor = "yellow";
  else if (category === "followers") iconColor = "green";

  return {
    id: Date.now().toString(),
    category,
    title,
    description: body,
    time: "Ahora",
    date: "Hoy",
    unread: true,
    iconColor,
  };
}
