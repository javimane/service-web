import { getMerchantProduct } from "@/lib/productMerchantData";
import { fetchWithApiKey } from "@/lib/serverFetch";
import { API_ENDPOINTS } from "@/services/api.config";

const PILOT_SCAN_LIMIT = 200;

function xmlText(value: string | number) {
  return String(value)
    // XML 1.0 allows tab, line feed and carriage return.
    // eslint-disable-next-line no-control-regex
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  try {
    const source = await fetchWithApiKey(
      `${API_ENDPOINTS.products.list}?page=1&limit=${PILOT_SCAN_LIMIT}`,
      { cache: "no-store", signal: AbortSignal.timeout(15_000) },
    );
    if (!source.ok) throw new Error(`Product catalog returned ${source.status}`);

    const payload = await source.json();
    const products = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(products)) throw new Error("Invalid product catalog");

    const items: string[] = [];
    for (const product of products) {
      if (!product) continue;
      const entry = getMerchantProduct(product);
      if (!entry?.listingId || !entry.sellerId) continue;

      const attributes = {
        id: entry.listingId,
        external_seller_id: entry.sellerId,
        title: entry.name.slice(0, 150),
        description: entry.description.slice(0, 5000),
        link: entry.url,
        image_link: entry.image,
        price: `${entry.price.toFixed(2)} ARS`,
        sale_price: entry.salePrice ? `${entry.salePrice.toFixed(2)} ARS` : undefined,
        availability: entry.inStock ? "in_stock" : "out_of_stock",
        condition: entry.condition,
        brand: entry.brand,
        gtin: entry.gtin,
      };
      items.push(`<item>${Object.entries(attributes)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `<g:${key}>${xmlText(value!)}</g:${key}>`)
        .join("")}</item>`);
    }

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Sercio</title>
    <link>https://sercio.com.ar/</link>
    <description>Catálogo inicial de productos comprables en Sercio</description>
    ${items.join("\n    ")}
  </channel>
</rss>`,
      { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to generate Merchant Center feed", error);
    return new Response("Catálogo temporalmente no disponible", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
