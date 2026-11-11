import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { desktopNotificationUrl, showDesktopNotification } from "./desktopNotifications";

describe("desktop notifications", () => {
  const originalNotification = window.Notification;
  const notificationSpy = vi.fn();

  beforeEach(() => {
    class MockNotification {
      static permission = "granted";
      onclick: (() => void) | null = null;
      constructor(title: string, options: NotificationOptions) {
        notificationSpy(title, options);
      }
      close() {}
    }
    Object.defineProperty(window, "Notification", { configurable: true, value: MockNotification });
    localStorage.removeItem("registered_device_token");
  });

  afterEach(() => {
    Object.defineProperty(window, "Notification", { configurable: true, value: originalNotification });
    vi.restoreAllMocks();
  });

  it("shows a system alert once when SSE and push report the same notification", () => {
    const id = `notification-${Date.now()}`;
    expect(showDesktopNotification({ id, title: "Nuevo pedido", content: "Tenés una venta" })).toBe(true);
    expect(showDesktopNotification({ title: "Nuevo pedido", notification: { body: "Tenés una venta" }, data: { notificationId: id } })).toBe(false);
    expect(notificationSpy).toHaveBeenCalledTimes(1);
  });

  it("keeps notification links inside the app", () => {
    expect(desktopNotificationUrl({ type: "message" })).toBe("/mensajes");
    expect(desktopNotificationUrl({ data: { url: "//external.example/path" } })).toBe("/panel?view=notifications");
  });

  it("opens the sale chat from order notifications, including older titles", () => {
    const orderId = "944bd971-43d5-4f06-8781-686df090076b";
    const target = `/panel?view=sales&orderId=${orderId}&openChat=1`;
    expect(desktopNotificationUrl({
      data: { type: "ORDER_CHAT_SALE", source_id: orderId, url: "/mensajes" },
    })).toBe(target);
    expect(desktopNotificationUrl({
      type: "message",
      title: `Cliente (Pedido #${orderId})`,
      data: { source_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
    })).toBe(target);
  });
});
