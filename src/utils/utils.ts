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

export const isUuid = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
};

export const extractIdFromSlug = (
  slug: string | string[] | undefined,
): string => {
  if (!slug) return "";

  const fullStr = Array.isArray(slug) ? slug.join("/") : String(slug);

  // 1. Check if the string contains a UUID anywhere
  const uuidMatch = fullStr.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  if (uuidMatch) {
    return uuidMatch[0];
  }

  // 2. Handle query param ?id=
  let cleanSlug = Array.isArray(slug) ? slug[slug.length - 1] || "" : slug;
  if (cleanSlug.includes("?id=")) {
    const qId = cleanSlug.split("?id=")[1].split("&")[0];
    if (/^\d+$/.test(qId) || isUuid(qId)) return qId;
  }

  // 3. Fallback for purely numeric IDs (e.g. professional profile id: "37" or "estudio-37")
  if (cleanSlug.includes("/")) {
    cleanSlug = cleanSlug.split("/").filter(Boolean).pop() || "";
  }
  const parts = cleanSlug.split("-");
  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart)) {
    return lastPart;
  }
  const firstPart = parts[0];
  if (/^\d+$/.test(firstPart)) {
    return firstPart;
  }

  // If neither UUID nor number, it's a semantic slug or search query (not an ID)
  return "";
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
