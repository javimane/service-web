import { describe, expect, it } from "vitest";
import { getMerchantProduct } from "./productMerchantData";

const product = {
  id: "aed27804-af3a-49fb-be6a-c7c314747fb7",
  name: "CAFEÍNA 200 MG",
  brand: "ENA",
  categories_products_id: 1,
  image_url: "https://sercio.com.ar/cafeina.jpg",
  ProfessionalProducts: [{
    id: "da95cce3-9f34-4ddd-8084-febb5f4780e0",
    professional_id: 82,
    listing_status: "active",
    is_active: true,
    stock: 5,
    price: "19900",
    offer_price: "17900",
  }],
};

describe("Merchant Center product data", () => {
  it("adds the brand after the product name", () => {
    expect(getMerchantProduct(product)?.title).toBe("CAFEÍNA 200 MG - ENA");
  });

  it("does not repeat a brand already in the name, regardless of case", () => {
    expect(getMerchantProduct({ ...product, name: "Cafeína 200 mg - Ena" })?.title)
      .toBe("Cafeína 200 mg - Ena");
  });

  it("does not mistake a brand inside another word for an existing brand", () => {
    expect(getMerchantProduct({ ...product, name: "ARENA" })?.title)
      .toBe("ARENA - ENA");
  });

  it("keeps the brand when shortening a title to 150 characters", () => {
    const entry = getMerchantProduct({ ...product, name: "A".repeat(160) });
    expect(entry?.title).toHaveLength(150);
    expect(entry?.title.endsWith(" - ENA")).toBe(true);
  });

  it("preserves the name when no brand is set", () => {
    expect(getMerchantProduct({ ...product, brand: null })?.title).toBe(product.name);
  });

  it("keeps the regular price and the sale price, using the sale in structured data", () => {
    const entry = getMerchantProduct(product);
    expect(entry).toMatchObject({ price: 19900, salePrice: 17900 });
    expect(entry?.structuredData.offers.price).toBe(17900);
  });

  it.each([null, "0", "19900"])("omits inactive offers (%s)", (offerPrice) => {
    const entry = getMerchantProduct({
      ...product,
      ProfessionalProducts: [{ ...product.ProfessionalProducts[0], offer_price: offerPrice }],
    });
    expect(entry?.salePrice).toBeUndefined();
    expect(entry?.structuredData.offers.price).toBe(19900);
  });
});
