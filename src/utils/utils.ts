/**
 * Formats a YYYY-MM-DD date string to a local locale string
 * avoiding timezone shifting by parsing manually.
 */
export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "";
  // Handle ISO strings by taking only the date part
  const cleanDateStr = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = cleanDateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString();
};

/**
 * Returns the best path for a professional profile,
 * prioritizing the SEO-friendly path if available.
 */
export const getProfilePath = (
  id: string | number,
  seoPath?: string | null,
) => {
  if (seoPath) {
    if (seoPath.startsWith("/profile/"))
      return seoPath.replace("/profile/", "/perfil/");
    if (seoPath.startsWith("/perfil/")) return seoPath;
    // Ensure no double slash when seoPath already starts with "/"
    const cleanSeo = seoPath.startsWith("/") ? seoPath : `/${seoPath}`;
    return `/perfil${cleanSeo}`;
  }
  return `/perfil/${id}`;
};

export const extractIdFromSlug = (slug: string | string[] | undefined): string => {
  if (!slug) return "";

  // Handle array from Next.js catch-all routes
  let cleanSlug = Array.isArray(slug) ? (slug[slug.length - 1] || "") : slug;
  if (!cleanSlug) return "";

  // If it's a full path or has query params, try to get the part after the last / or =
  if (cleanSlug.includes("?id=")) {
    cleanSlug = cleanSlug.split("?id=")[1];
  } else if (cleanSlug.includes("/")) {
    cleanSlug = cleanSlug.split("/").pop() || "";
  }

  const parts = cleanSlug.split("-");

  // UUID check: 5 parts with specific lengths (8-4-4-4-12)
  if (
    parts.length >= 5 &&
    parts[0].length === 8 &&
    parts[1].length === 4 &&
    parts[2].length === 4 &&
    parts[3].length === 4 &&
    parts[4].length === 12
  ) {
    return parts.slice(0, 5).join("-");
  }

  // Fallback to first part for numeric IDs
  return parts[0];
};

/**
 * Ensures an SEO path is absolute and correctly prefixed if it's missing.
 */
export const normalizeSeoPath = (
  path: string | null | undefined,
  prefix: string,
  fallbackId: string | number,
) => {
  if (!path) return `${prefix}/${fallbackId}`;
  return path.startsWith("/") ? path : `${prefix}/${path}`;
};
