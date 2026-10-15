import {
  Bell,
  Heart,
  MessageSquare,
  Briefcase,
  Ticket,
  Upload,
  ShoppingBag,
  Truck,
  CreditCard,
  FileText,
  CalendarCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  XCircle,
  ShieldAlert,
  LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/routes/paths";

export interface NotificationActionItem {
  id?: string | number;
  type?: string;
  source_id?: string | null;
  sender_id?: string | null;
  title?: string;
  content?: string;
  is_read?: boolean;
  created_at?: string;
  [key: string]: any;
}

export interface NotificationMeta {
  icon: LucideIcon;
  color: string;
  category: "sales" | "purchases" | "proposals" | "messages" | "promotions" | "reels" | "system";
}

export function getReportDownloadUrl(notif: NotificationActionItem): string | null {
  if (String(notif.type || "").trim().toUpperCase() !== "REPORT_READY") return null;
  try {
    const url = new URL(String(notif.content || ""));
    const isS3 = url.hostname === "s3.amazonaws.com" ||
      /\.s3\.amazonaws\.com$/.test(url.hostname) ||
      /^s3[.-][a-z0-9-]+\.amazonaws\.com$/.test(url.hostname) ||
      /\.s3[.-][a-z0-9-]+\.amazonaws\.com$/.test(url.hostname);
    if (url.protocol !== "https:" || !isS3 || !url.pathname.toLowerCase().endsWith(".xlsx") ||
        !url.searchParams.has("X-Amz-Signature")) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function getNotificationDescription(notif: NotificationActionItem): string {
  return String(notif.type || "").trim().toUpperCase() === "REPORT_READY"
    ? "Tocá para descargar el archivo Excel. El enlace tiene una vigencia limitada."
    : String(notif.content || "");
}

/**
 * Normaliza y devuelve icono, color semántico y categoría para cualquier tipo de notificación del backend.
 */
export function getNotificationMeta(rawType?: string): NotificationMeta {
  const type = String(rawType || "").trim().toUpperCase();

  switch (type) {
    // ── Vendedor / Ventas ──
    case "PRODUCT_SALE":
    case "SERVICE_SALE":
      return { icon: ShoppingBag, color: "green", category: "sales" };

    case "SHIPMENT_DRIVER_AT_STORE":
      return { icon: Truck, color: "blue", category: "sales" };

    case "ORDER_RETURN_RECEIVED":
      return { icon: RotateCcw, color: "orange", category: "sales" };

    // ── Comprador / Compras ──
    case "PAYMENT_CONFIRMED":
      return { icon: CreditCard, color: "green", category: "purchases" };

    case "SERVICE_APPOINTMENT_SCHEDULED":
      return { icon: CalendarCheck, color: "purple", category: "purchases" };

    case "ORDER_CONFIRMED":
      return { icon: CheckCircle, color: "blue", category: "purchases" };

    case "ORDER_PREPARING":
    case "ORDER_DISPATCHED":
      return { icon: ShoppingBag, color: "orange", category: "purchases" };

    case "ORDER_READY_FOR_PICKUP":
      return { icon: ShoppingBag, color: "teal", category: "purchases" };

    case "SHIPMENT_READY_FOR_COLLECTION":
    case "SHIPMENT_IN_TRANSIT":
    case "TRANSPORT_UPDATED":
      return { icon: Truck, color: "blue", category: "purchases" };

    case "INVOICE_AVAILABLE":
      return { icon: FileText, color: "teal", category: "purchases" };

    case "REPORT_READY":
      return { icon: FileText, color: "teal", category: "system" };

    // ── Compartidos (Ventas o Compras) ──
    case "ORDER_DELIVERED":
      return { icon: CheckCircle, color: "green", category: "purchases" };

    case "ORDER_CANCELLED":
    case "SHIPMENT_CANCELLED":
      return { icon: XCircle, color: "red", category: "purchases" };

    case "ORDER_REFUNDED":
      return { icon: RotateCcw, color: "orange", category: "purchases" };

    // ── Logística Rider ──
    case "TRIP_OFFER":
      return { icon: Truck, color: "teal", category: "system" };

    // ── Presupuestos ──
    case "PROPOSAL":
    case "PROPOSSAL":
      return { icon: Briefcase, color: "purple", category: "proposals" };

    // ── Chat / Mensajes ──
    case "MESSAGE":
    case "CHAT":
    case "COMMENT":
      return { icon: MessageSquare, color: "green", category: "messages" };

    // ── Promociones ──
    case "PROMOTION":
      return { icon: Ticket, color: "orange", category: "promotions" };

    // ── Reels / Multimedia ──
    case "LIKE":
      return { icon: Heart, color: "red", category: "reels" };

    case "UPLOAD":
      return { icon: Upload, color: "teal", category: "reels" };

    // ── Soporte / Errores ──
    case "ERROR_REPORT":
      return { icon: AlertTriangle, color: "red", category: "system" };

    // ── Denuncias / Reportes de publicación ──
    case "LISTING_REPORT_RECEIVED":
    case "LISTING_REPORT":
      return { icon: ShieldAlert, color: "orange", category: "system" };

    default:
      if (type.startsWith("CLAIM_")) {
        return { icon: AlertTriangle, color: "orange", category: "purchases" };
      }
      return { icon: Bell, color: "gray", category: "system" };
  }
}

/**
 * Determina la URL de destino adecuada según el tipo de notificación, source_id, sender_id y rol del usuario.
 */
export function getNotificationTargetUrl(
  notif: NotificationActionItem,
  options?: { isProfessional?: boolean }
): string {
  const type = String(notif.type || "").trim().toUpperCase();
  const sourceId = notif.source_id ? String(notif.source_id).trim() : "";
  const senderId = notif.sender_id ? String(notif.sender_id).trim() : "";
  const isProfessional = Boolean(options?.isProfessional);

  switch (type) {
    // ── Destino Vendedor: /panel?view=sales&orderId=... ──
    case "PRODUCT_SALE":
    case "SERVICE_SALE":
    case "SHIPMENT_DRIVER_AT_STORE":
    case "ORDER_RETURN_RECEIVED":
      return sourceId
        ? `${ROUTES.dashboard}?view=sales&orderId=${encodeURIComponent(sourceId)}`
        : `${ROUTES.dashboard}?view=sales`;

    // ── Destino Comprador: /panel?view=purchases&orderId=... ──
    case "PAYMENT_CONFIRMED":
    case "SERVICE_APPOINTMENT_SCHEDULED":
    case "ORDER_CONFIRMED":
    case "ORDER_PREPARING":
    case "ORDER_DISPATCHED":
    case "ORDER_READY_FOR_PICKUP":
    case "SHIPMENT_READY_FOR_COLLECTION":
    case "SHIPMENT_IN_TRANSIT":
    case "INVOICE_AVAILABLE":
    case "TRANSPORT_UPDATED":
      return sourceId
        ? `${ROUTES.dashboard}?view=purchases&orderId=${encodeURIComponent(sourceId)}`
        : `${ROUTES.dashboard}?view=purchases`;

    // ── Compartidos: si es profesional va a Ventas, si es comprador va a Compras ──
    case "ORDER_DELIVERED":
    case "ORDER_CANCELLED":
    case "ORDER_REFUNDED":
    case "SHIPMENT_CANCELLED":
      if (isProfessional) {
        return sourceId
          ? `${ROUTES.dashboard}?view=sales&orderId=${encodeURIComponent(sourceId)}`
          : `${ROUTES.dashboard}?view=sales`;
      }
      return sourceId
        ? `${ROUTES.dashboard}?view=purchases&orderId=${encodeURIComponent(sourceId)}`
        : `${ROUTES.dashboard}?view=purchases`;

    // ── Logística Rider: /panel?view=riders ──
    case "TRIP_OFFER":
      return `${ROUTES.dashboard}?view=riders`;

    // ── Presupuestos: /panel?view=proposals-view ──
    case "PROPOSAL":
    case "PROPOSSAL":
      return `${ROUTES.dashboard}?view=proposals-view`;

    // ── Mensajes / Chat: /mensajes o /mensajes?userId=... ──
    case "MESSAGE":
    case "CHAT":
      return senderId
        ? `${ROUTES.messages}?userId=${encodeURIComponent(senderId)}`
        : ROUTES.messages;

    // ── Promociones: /panel?view=promotions-all ──
    case "PROMOTION":
      return `${ROUTES.dashboard}?view=promotions-all`;

    // ── Reels / Multimedia ──
    case "LIKE":
    case "COMMENT":
    case "UPLOAD":
      return ROUTES.reels;

    // ── Reporte de error ──
    case "ERROR_REPORT":
      return `${ROUTES.dashboard}?view=report-errors`;

    // ── Denuncias / Reportes de publicación ──
    case "LISTING_REPORT_RECEIVED":
    case "LISTING_REPORT":
      return sourceId
        ? `${ROUTES.dashboard}?view=denuncias&targetId=${encodeURIComponent(sourceId)}`
        : `${ROUTES.dashboard}?view=denuncias`;

    default:
      // Estados de reclamos (CLAIM_*)
      if (type.startsWith("CLAIM_")) {
        const view = isProfessional ? "sales" : "purchases";
        return sourceId
          ? `${ROUTES.dashboard}?view=${view}&orderId=${encodeURIComponent(sourceId)}`
          : `${ROUTES.dashboard}?view=${view}`;
      }

      // Por defecto lleva a la vista general de notificaciones
      return `${ROUTES.dashboard}?view=notifications`;
  }
}
