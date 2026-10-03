import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import type { OrderSummary } from "@/services/commerceService";

export async function downloadThermalTicketPdf(orders: OrderSummary[], filename: string) {
  let documentPdf: jsPDF | null = null;
  for (const order of orders) {
    const element = document.getElementById(`thermal-ticket-${order.id}`);
    if (!element) throw new Error("No se encontró la vista previa del ticket.");
    const png = await toPng(element, { pixelRatio: 2, cacheBust: true });
    const heightMm = Math.max(80, element.scrollHeight * 80 / element.clientWidth);
    if (!documentPdf) {
      documentPdf = new jsPDF({ unit: "mm", format: [80, heightMm], orientation: "portrait" });
    } else {
      documentPdf.addPage([80, heightMm], "portrait");
    }
    documentPdf.addImage(png, "PNG", 0, 0, 80, heightMm);
  }
  if (!documentPdf) throw new Error("No hay pedidos para imprimir.");
  documentPdf.save(filename);
}
