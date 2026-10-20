self.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || data.title || "Nueva notificación";
  const body = notification.body || data.body || data.content || "";
  function resolveNotificationUrl(data, title) {
    var type = String(data.type || "").trim().toUpperCase();
    var sourceId = data.source_id ? encodeURIComponent(String(data.source_id).trim()) : "";
    var senderId = data.sender_id ? encodeURIComponent(String(data.sender_id).trim()) : "";
    var legacyOrder = String(title || "").match(/\bPedido #([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i);
    if (type.indexOf("ORDER_CHAT") === 0 ||
        ((type === "MESSAGE" || type === "CHAT") && legacyOrder)) {
      var orderId = type.indexOf("ORDER_CHAT") === 0
        ? sourceId
        : encodeURIComponent(legacyOrder[1]);
      var view = type === "ORDER_CHAT_SALE" ||
        (legacyOrder && /^Cliente\b/i.test(title)) ? "sales" : "purchases";
      return orderId
        ? "/panel?view=" + view + "&orderId=" + orderId + "&openChat=1"
        : "/panel?view=notifications";
    }

    if (data.url) return data.url;

    switch (type) {
      case "PRODUCT_SALE":
      case "SERVICE_SALE":
      case "SHIPMENT_DRIVER_AT_STORE":
      case "ORDER_RETURN_RECEIVED":
        return sourceId ? "/panel?view=sales&orderId=" + sourceId : "/panel?view=sales";

      case "PAYMENT_CONFIRMED":
      case "SERVICE_APPOINTMENT_SCHEDULED":
      case "ORDER_CONFIRMED":
      case "ORDER_PREPARING":
      case "ORDER_READY_FOR_PICKUP":
      case "SHIPMENT_READY_FOR_COLLECTION":
      case "SHIPMENT_IN_TRANSIT":
      case "INVOICE_AVAILABLE":
      case "TRANSPORT_UPDATED":
        return sourceId ? "/panel?view=purchases&orderId=" + sourceId : "/panel?view=purchases";

      case "ORDER_DELIVERED":
      case "ORDER_CANCELLED":
      case "ORDER_REFUNDED":
      case "SHIPMENT_CANCELLED":
        return sourceId ? "/panel?view=purchases&orderId=" + sourceId : "/panel?view=purchases";

      case "TRIP_OFFER":
        return "/panel?view=riders";

      case "PROPOSAL":
      case "PROPOSSAL":
        return "/panel?view=proposals-view";

      case "MESSAGE":
      case "CHAT":
        return senderId ? "/mensajes?userId=" + senderId : "/mensajes";

      case "PROMOTION":
        return "/panel?view=promotions-all";

      case "LIKE":
      case "COMMENT":
      case "UPLOAD":
        return "/reels";

      case "ERROR_REPORT":
        return "/panel?view=report-errors";

      default:
        if (type.indexOf("CLAIM_") === 0) {
          return sourceId ? "/panel?view=purchases&orderId=" + sourceId : "/panel?view=purchases";
        }
        return "/panel?view=notifications";
    }
  }

  const rawUrl = resolveNotificationUrl(data, title);
  const url = rawUrl.startsWith("/") && !rawUrl.startsWith("//")
    ? new URL(rawUrl, self.location.origin).href
    : new URL("/panel?view=notifications", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      const visibleClient = clientList.find(function (client) {
        return client.visibilityState === "visible";
      });
      if (visibleClient) {
        visibleClient.postMessage({ type: "sercio-push", payload: payload });
        return;
      }
      return self.registration.showNotification(title, {
        body: body,
        icon: "/favicon.svg",
        tag: String(data.notificationId || data.notification_id || payload.messageId || title + ":" + body),
        data: { url: url },
      });
    }),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl =
    (event.notification &&
      event.notification.data &&
      event.notification.data.url) ||
    "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i += 1) {
          var client = clientList[i];
          if ("focus" in client && new URL(client.url).origin === self.location.origin) {
            return client.focus().then(function () {
              return client.navigate(targetUrl);
            });
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});
