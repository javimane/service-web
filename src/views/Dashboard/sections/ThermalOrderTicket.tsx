import type { OrderSummary } from "@/services/commerceService";
import {
  getBuyerEmail,
  getBuyerName,
  getDeliveryAddress,
  getOrderLines,
  getOrderNumber,
  getOrderQrPayload,
  getSaleLocation,
  getTicketDelivery,
} from "./orderTicketData";
import "./ThermalOrderTicket.css";
import OrderItemPricing from "@/components/OrderItemPricing/OrderItemPricing";

type ThermalOrderTicketProps = {
  order: OrderSummary;
  qrDataUrl?: string;
  storeName: string;
  branchName: string;
};

export default function ThermalOrderTicket({ order, qrDataUrl, storeName, branchName }: ThermalOrderTicketProps) {
  const lines = getOrderLines(order);
  const isService = Boolean(order.service_id || order.service || order.items?.some((item) => item.service_id || item.service || item.item_type === "service"));
  const saleLocation = getSaleLocation(order);
  const ticketDelivery = getTicketDelivery(order);
  const ticketCode = JSON.parse(getOrderQrPayload(order)).security_code as string;
  return <article id={`thermal-ticket-${order.id}`} className="thermal-order-ticket thermal-order-ticket--printable">
    <header className="thermal-order-ticket__header">
      <strong>SERCIO</strong>
      <span>{isService ? "FICHA DE SERVICIO" : "ETIQUETA DE PEDIDO"}</span>
      <span>{storeName}</span>
      <span className="thermal-order-ticket__branch">{order.branch?.name || branchName || saleLocation.name}</span>
      <span>{saleLocation.address}</span>
    </header>
    <div className="thermal-order-ticket__identity">
      {qrDataUrl && ticketCode && <img className="thermal-order-ticket__qr" src={qrDataUrl} alt={`QR de pedido ${getOrderNumber(order)}`} />}
      <strong>{getOrderNumber(order)}</strong>
      <span>{new Date(order.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
    </div>
    <section className="thermal-order-ticket__section">
      <h3>{order.delivery_type === "coordinate_with_merchant" ? "Destinatario" : "Comprador"}</h3>
      <p><strong>{getBuyerName(order)}</strong></p>
      {getBuyerEmail(order) !== "No informado" && <p>Email: {getBuyerEmail(order)}</p>}
      {!isService && <p>{getDeliveryAddress(order)}</p>}
      {(!isService || ticketDelivery.label === "En domicilio del cliente") && order.delivery_address?.notes && <p>Indicaciones de entrega: {order.delivery_address.notes}</p>}
    </section>
    <section className="thermal-order-ticket__section">
      <h3>{isService ? "Servicio" : "Contenido"}</h3>
      {lines.map((line) => <div className="thermal-order-ticket__item" key={line.id}>
        <strong>{line.quantity} × {line.name}</strong>
        {line.attributes && <span>{line.attributes}</span>}
        {line.brand && <span>Marca: {line.brand}</span>}
        {line.ean && <span>EAN: {line.ean}</span>}
        <OrderItemPricing pricing={line.pricing} unitPrice={line.unitPrice} />
        <span>Subtotal: ${line.subtotal.toLocaleString("es-AR")}</span>
      </div>)}
      {order.appointment && <p>Turno: {order.appointment.appointment_date} {order.appointment.appointment_time} hs</p>}
      {isService && order.appointment?.notes && <p>Indicaciones del servicio: {order.appointment.notes}</p>}
    </section>
    <section className="thermal-order-ticket__section thermal-order-ticket__section--last">
      <p>Entrega: {ticketDelivery.label}</p>
      {ticketDelivery.location && <p>Lugar del servicio: {ticketDelivery.location}</p>}
      {order.pickup_code && <p className="thermal-order-ticket__pickup-code">Código de retiro: {order.pickup_code}</p>}
      {order.delivery_type === "shipment" && ticketCode && <p className="thermal-order-ticket__pickup-code">Código para el rider: {ticketCode}</p>}
      <strong>Total: ${Number(order.total_amount ?? 0).toLocaleString("es-AR")}</strong>
    </section>
    <footer className="thermal-order-ticket__footer">sercio.com.ar · soporte@sercio.com.ar</footer>
  </article>;
}
