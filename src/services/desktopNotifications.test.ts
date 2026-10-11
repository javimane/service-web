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
});
