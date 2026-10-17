import { describe, it, expect } from "vitest";
import {
  getNotificationMeta,
  getNotificationTargetUrl,
  getNotificationDescription,
  getReportDownloadUrl,
} from "./notificationNavigation";
import { ROUTES } from "@/routes/paths";

describe("notificationNavigation", () => {
  it("reconoce el enlace firmado de un reporte y oculta la URL en el texto", () => {
    const report = {
      type: "report_ready",
      content: "https://reports.s3.us-east-1.amazonaws.com/reports/ventas.xlsx?X-Amz-Signature=abc",
    };
    expect(getReportDownloadUrl(report)).toBe(report.content);
    expect(getReportDownloadUrl({ ...report, content: "https://reports.s3.amazonaws.com/reports/ventas.xlsx?X-Amz-Signature=abc" })).not.toBeNull();
    expect(getNotificationDescription(report)).toContain("descargar");
    expect(getNotificationDescription(report)).not.toContain("amazonaws");
  });

  it("rechaza enlaces externos no firmados como descarga de reporte", () => {
    expect(getReportDownloadUrl({ type: "report_ready", content: "https://evil.example/reporte.xlsx?X-Amz-Signature=abc" })).toBeNull();
    expect(getReportDownloadUrl({ type: "report_ready", content: "javascript:alert(1)" })).toBeNull();
  });

  describe("getNotificationMeta", () => {
    it("mapea ventas a ShoppingBag con verde y categoría sales", () => {
      const meta = getNotificationMeta("PRODUCT_SALE");
      expect(meta.category).toBe("sales");
      expect(meta.color).toBe("green");
    });

    it("mapea compras a categoría purchases", () => {
      const meta = getNotificationMeta("ORDER_PREPARING");
      expect(meta.category).toBe("purchases");
      expect(meta.color).toBe("orange");
    });

    it("mapea reclamos CLAIM_* a alert y purchases", () => {
      const meta = getNotificationMeta("CLAIM_OPENED");
      expect(meta.category).toBe("purchases");
      expect(meta.color).toBe("orange");
    });

    it("mapea ofertas de viaje a riders", () => {
      const meta = getNotificationMeta("TRIP_OFFER");
      expect(meta.category).toBe("system");
      expect(meta.color).toBe("teal");
    });

    it("mapea denuncias de publicacion a alert y category system", () => {
      const meta = getNotificationMeta("LISTING_REPORT_RECEIVED");
      expect(meta.category).toBe("system");
      expect(meta.color).toBe("orange");
    });
  });

  describe("getNotificationTargetUrl", () => {
    it("dirige la oferta al comprador y el rechazo al comercio", () => {
      expect(getNotificationTargetUrl({ type: "CLAIM_OFFERED", source_id: "order-1" },
        { isProfessional: true })).toBe(`${ROUTES.dashboard}?view=purchases&orderId=order-1`);
      expect(getNotificationTargetUrl({ type: "CLAIM_OFFER_REJECTED", source_id: "order-1" }))
        .toBe(`${ROUTES.dashboard}?view=sales&orderId=order-1`);
    });
    it("dirige ventas con source_id a /panel?view=sales&orderId=...", () => {
      const url = getNotificationTargetUrl({
        type: "PRODUCT_SALE",
        source_id: "order-123",
      });
      expect(url).toBe(`${ROUTES.dashboard}?view=sales&orderId=order-123`);
    });

    it("dirige compras con source_id a /panel?view=purchases&orderId=...", () => {
      const url = getNotificationTargetUrl({
        type: "ORDER_CONFIRMED",
        source_id: "order-456",
      });
      expect(url).toBe(`${ROUTES.dashboard}?view=purchases&orderId=order-456`);
    });

    it("dirige eventos compartidos a sales si es profesional", () => {
      const url = getNotificationTargetUrl(
        {
          type: "ORDER_DELIVERED",
          source_id: "order-789",
        },
        { isProfessional: true }
      );
      expect(url).toBe(`${ROUTES.dashboard}?view=sales&orderId=order-789`);
    });

    it("dirige eventos compartidos a purchases si es comprador", () => {
      const url = getNotificationTargetUrl(
        {
          type: "ORDER_DELIVERED",
          source_id: "order-789",
        },
        { isProfessional: false }
      );
      expect(url).toBe(`${ROUTES.dashboard}?view=purchases&orderId=order-789`);
    });

    it("dirige el reclamo de un comprador profesional a sus compras", () => {
      const url = getNotificationTargetUrl(
        { type: "CLAIM_RESOLVED", source_id: "order-1", sender_id: "buyer-1" },
        { isProfessional: true, currentUserId: "buyer-1" },
      );
      expect(url).toBe(`${ROUTES.dashboard}?view=purchases&orderId=order-1`);
    });

    it("dirige TRIP_OFFER a /panel?view=riders", () => {
      const url = getNotificationTargetUrl({
        type: "TRIP_OFFER",
      });
      expect(url).toBe(`${ROUTES.dashboard}?view=riders`);
    });

    it("dirige mensajes con sender_id a /mensajes?userId=...", () => {
      const url = getNotificationTargetUrl({
        type: "MESSAGE",
        sender_id: "user-abc",
      });
      expect(url).toBe(`${ROUTES.messages}?userId=user-abc`);
    });

    it("dirige ERROR_REPORT a /panel?view=report-errors", () => {
      const url = getNotificationTargetUrl({
        type: "ERROR_REPORT",
      });
      expect(url).toBe(`${ROUTES.dashboard}?view=report-errors`);
    });

    it("dirige LISTING_REPORT_RECEIVED a /panel?view=denuncias", () => {
      const url = getNotificationTargetUrl({
        type: "listing_report_received",
        source_id: "target-123",
      });
      expect(url).toBe(`${ROUTES.dashboard}?view=denuncias&targetId=target-123`);

      const urlWithoutSource = getNotificationTargetUrl({
        type: "listing_report_received",
      });
      expect(urlWithoutSource).toBe(`${ROUTES.dashboard}?view=denuncias`);
    });
  });
});
