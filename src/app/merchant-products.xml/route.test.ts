import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithApiKey } from "@/lib/serverFetch";
import { getMerchantProduct } from "@/lib/productMerchantData";
import { GET } from "./route";

vi.mock("@/lib/serverFetch", () => ({ fetchWithApiKey: vi.fn() }));

const product = {
  id: "042fcecf-8fda-42ce-8ff9-04d729c6f843",
  seo_path: "/taza/042fcecf-8fda-42ce-8ff9-04d729c6f843",
  name: "Taza & plato",
  description: "Set de <cerámica>",
  categories_products_id: 1,
  brand: "Sercio",
  ean: "4006381333931",
  Images: [{ image_url: "https://sercio.com.ar/taza.jpg" }],
  ProfessionalProducts: [{
    id: "listing-1",
    professional_id: 82,
    listing_status: "active",
    is_active: true,
    stock: 0,
    price: 1500,
    offer_price: 1200,
    currency_code: "ARG",
  }],
};

beforeEach(() => vi.resetAllMocks());

describe("Merchant Center product feed", () => {
  it("publishes the same price and availability as the product schema", async () => {
    vi.mocked(fetchWithApiKey).mockResolvedValue(Response.json([product]));
    const response = await GET();
    const xml = new DOMParser().parseFromString(await response.text(), "application/xml");
    const offer = getMerchantProduct(product)?.structuredData.offers;

    expect(response.status).toBe(200);
    expect(xml.querySelector("parsererror")).toBeNull();
    expect(xml.getElementsByTagName("g:title")[0].textContent).toBe("Taza & plato");
    expect(xml.getElementsByTagName("g:description")[0].textContent).toBe("Set de <cerámica>");
    expect(xml.getElementsByTagName("g:price")[0].textContent).toBe("1500.00 ARS");
    expect(xml.getElementsByTagName("g:sale_price")[0].textContent).toBe(`${offer?.price.toFixed(2)} ARS`);
    expect(xml.getElementsByTagName("g:availability")[0].textContent).toBe("out_of_stock");
    expect(offer?.availability).toBe("https://schema.org/OutOfStock");
    expect(xml.getElementsByTagName("g:link")[0].textContent).toBe(offer?.url);
    expect(xml.getElementsByTagName("g:external_seller_id")[0].textContent).toBe("82");
    expect(xml.getElementsByTagName("g:gtin")[0].textContent).toBe(product.ean);
  });

  it("excludes listings that are not eligible for the pilot", async () => {
    vi.mocked(fetchWithApiKey).mockResolvedValue(Response.json([
      { ...product, categories_products_id: 45 },
      { ...product, ProfessionalProducts: [...product.ProfessionalProducts, { ...product.ProfessionalProducts[0], professional_id: 83 }] },
      { ...product, ProfessionalProducts: [{ ...product.ProfessionalProducts[0], currency_code: "USD" }] },
      { ...product, ProfessionalProducts: [{ ...product.ProfessionalProducts[0], is_active: false }] },
    ]));
    const response = await GET();
    expect(await response.text()).not.toContain("<item>");
  });

  it("returns an error instead of replacing the catalog with an empty feed on API failure", async () => {
    vi.mocked(fetchWithApiKey).mockResolvedValue(new Response(null, { status: 500 }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect((await GET()).status).toBe(503);
    } finally {
      log.mockRestore();
    }
  });
});
