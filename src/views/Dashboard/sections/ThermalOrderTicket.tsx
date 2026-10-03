import type { OrderSummary } from "@/services/commerceService";
import {
  getBuyerEmail,
  getBuyerName,
  getBuyerPhone,
  getDeliveryAddress,
  getOrderLines,
  getOrderNumber,
  getSaleLocation,
} from "./orderTicketData";
import "./ThermalOrderTicket.css";

type ThermalOrderTicketProps = {
  order: OrderSummary;
  qrDataUrl?: string;
  storeName: string;
  branchName: string;
};

export default function ThermalOrderTicket({ order, qrDataUrl, storeName, branchName }: ThermalOrderTicketProps) {
  const lines = getOrderLines(order);
  const isService = Boolean(order.service_id || order.service);
  const saleLocation = getSaleLocation(order);
  return <article id={`thermal-ticket-${order.id}`} className="thermal-order-ticket thermal-order-ticket--printable">
    <header className="thermal-order-ticket__header">
      <strong>SERCIO</strong>
      <span>{isService ? "FICHA DE SERVICIO" : "ETIQUETA DE PEDIDO"}</span>
      <span>{storeName}</span>
      <span className="thermal-order-ticket__branch">{order.branch?.name || branchName || saleLocation.name}</span>
      <span>{saleLocation.address}</span>
      {saleLocation.phone && <span>Tel: {saleLocation.phone}</span>}
    </header>
    <div className="thermal-order-ticket__identity">
      {qrDataUrl && <img className="thermal-order-ticket__qr" src={qrDataUrl} alt={`QR de pedido ${getOrderNumber(order)}`} />}
      <strong>{getOrderNumber(order)}</strong>
      <span>{new Date(order.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
    </div>
    <section className="thermal-order-ticket__section">
      <h3>Comprador</h3>
      <p><strong>{getBuyerName(order)}</strong></p>
      {getBuyerPhone(order) !== "No informado" && <p>Tel: {getBuyerPhone(order)}</p>}
      {getBuyerEmail(order) !== "No informado" && <p>Email: {getBuyerEmail(order)}</p>}
      <p>{getDeliveryAddress(order)}</p>
      {order.delivery_address?.notes && <p>Indicaciones: {order.delivery_address.notes}</p>}
    </section>
    <section className="thermal-order-ticket__section">
      <h3>{isService ? "Servicio" : "Contenido"}</h3>
      {lines.map((line) => <div className="thermal-order-ticket__item" key={line.id}>
        <strong>{line.quantity} × {line.name}</strong>
        {line.attributes && <span>{line.attributes}</span>}
        {line.brand && <span>Marca: {line.brand}</span>}
        {line.ean && <span>EAN: {line.ean}</span>}
      </div>)}
      {order.appointment && <p>Turno: {order.appointment.appointment_date} {order.appointment.appointment_time} hs</p>}
    </section>
    <section className="thermal-order-ticket__section thermal-order-ticket__section--last">
      <p>Entrega: {order.delivery_type === "pickup" ? "Retiro en sucursal" : order.delivery_type === "shipment" ? "Envío a domicilio" : "A convenir"}</p>
      {order.pickup_code && <p className="thermal-order-ticket__pickup-code">Código de retiro: {order.pickup_code}</p>}
      <strong>Total: ${Number(order.total_amount ?? 0).toLocaleString("es-AR")}</strong>
    </section>
    <footer className="thermal-order-ticket__footer">sercio.com.ar · soporte@sercio.com.ar</footer>
  </article>;
}
