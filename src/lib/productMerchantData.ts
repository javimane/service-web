import { isUuid } from "@/utils/utils";

const SITE_URL = "https://sercio.com.ar";
const SCHEMA = "https://schema.org";

export const AGE_RESTRICTED_PRODUCT_SUBCATEGORIES = new Set([
  "2d6c30b1-95b8-4a2a-b43f-f9f09e5c507a",
  "fb762aba-7df9-4f6c-b507-651323fab7bb",
  "ea1d5cc2-5ed0-4227-a5e3-0f292d4ec67a",
]);

type MerchantListing = {
  id?: string;
  professional_id?: number;
  listing_status?: string;
  is_active?: boolean;
  stock?: number | string | null;
  price?: number | string | null;
  offer_price?: number | string | null;
  wholesale?: boolean | null;
  wholesale_unit?: number | null;
  wholesale_price?: number | null;
  currency_code?: string | null;
  product_condition?: string | null;
  Professional?: {
    is_active?: boolean;
    Company?: { name?: string } | { name?: string }[];
    Profile?: { display_name?: string };
  } | null;
};

type MerchantProduct = {
  id: string;
  seo_path?: string | null;
  name?: string;
  description?: string | null;
  brand?: string | null;
  ean?: string | null;
  category_id?: number | string | null;
  categories_products_id?: number | null;
  subcategory_id?: string | null;
  sub_categories_products_id?: string | null;
  Category?: { id?: number; name?: string };
  SubCategory?: { id?: string };
  currency_code?: string | null;
  image_url?: string | null;
  Images?: (string | { image_url?: string; url?: string })[];
  ProfessionalProducts?: MerchantListing[];
};

export function getCanonicalProductUrl(product: { id?: string; seo_path?: string | null }, fallbackPath: string) {
  const path = product.seo_path?.trim();
  if (!path && !product.id) return `${SITE_URL}${fallbackPath}`;
  const suffix = (path || product.id || "").replace(/^\/+/, "");
  return `${SITE_URL}/${suffix.startsWith("productos/") ? suffix : `productos/${suffix}`}`;
}

function validGtin(value?: string | null) {
  const gtin = value?.trim();
  if (!gtin || !/^(?:\d{8}|\d{12,14})$/.test(gtin) || /^0+$/.test(gtin)) return undefined;
  const total = [...gtin].reverse().reduce(
    (sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return total % 10 === 0 ? gtin : undefined;
}

export function getMerchantProduct(product: MerchantProduct) {
  const listings = product.ProfessionalProducts;
  if (!isUuid(String(product.id ?? "")) || listings?.length !== 1) return null;
  const [listing] = listings;
  const category = Number(product.category_id ?? product.categories_products_id ?? product.Category?.id);
  const subcategory = product.subcategory_id ?? product.sub_categories_products_id ?? product.SubCategory?.id;
  if (!category || [45, 46].includes(category) ||
      AGE_RESTRICTED_PRODUCT_SUBCATEGORIES.has(subcategory?.toLowerCase() ?? "") ||
      listing.listing_status !== "active" || listing.is_active !== true ||
      listing.Professional?.is_active === false || listing.product_condition === "replica" ||
      (listing.wholesale && Number(listing.wholesale_unit) === 1 && Number(listing.wholesale_price) > 0)) {
    return null;
  }

  const currency = (listing.currency_code || product.currency_code || "ARG").toUpperCase();
  const stock = Number(listing.stock);
  const price = Number(listing.price);
  const offer = Number(listing.offer_price);
  if (!["ARS", "ARG"].includes(currency) ||
      listing.stock == null || !Number.isFinite(stock) || stock < 0 ||
      !Number.isFinite(price) || price <= 0 ||
      (listing.offer_price != null && (!Number.isFinite(offer) || offer < 0 || offer > price))) return null;

  const name = product.name?.trim();
  const images = (product.Images ?? [])
    .map((image) => typeof image === "string" ? image : image.image_url || image.url)
    .concat(product.image_url ?? undefined)
    .filter((url): url is string => Boolean(url && /^https:\/\//i.test(url)));
  if (!name || !images.length) return null;

  const company = listing.Professional?.Company;
  const seller = (Array.isArray(company) ? company[0]?.name : company?.name) ||
    listing.Professional?.Profile?.display_name;
  const brand = product.brand?.trim() || undefined;
  const description = product.description?.trim() || name;
  const salePrice = Number.isFinite(offer) && offer > 0 && offer < price ? offer : undefined;
  const condition = listing.product_condition === "used" ? "used" : "new";
  const gtin = listing.product_condition === "alternative" || listing.product_condition === "artisanal"
    ? undefined : validGtin(product.ean);
  const url = getCanonicalProductUrl(product, `/productos/${product.id}`);
  const inStock = stock >= 1;

  return {
    listingId: listing.id,
    sellerId: listing.professional_id,
    condition,
    brand,
    gtin,
    name,
    description,
    image: images[0],
    url,
    price,
    salePrice,
    inStock,
    structuredData: {
      "@context": SCHEMA,
      "@type": "Product",
      name,
      description,
      image: [...new Set(images)],
      category: product.Category?.name,
      brand: brand ? { "@type": "Brand", name: brand } : undefined,
      gtin,
      offers: {
        "@type": "Offer",
        priceCurrency: "ARS",
        price: salePrice ?? price,
        availability: `${SCHEMA}/${inStock ? "InStock" : "OutOfStock"}`,
        itemCondition: `${SCHEMA}/${condition === "used" ? "UsedCondition" : "NewCondition"}`,
        url,
        seller: seller ? { "@type": "Organization", name: seller } : undefined,
      },
    },
  };
}
