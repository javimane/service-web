type ImageRecord = { image_url?: unknown; display_order?: unknown };
export function variantParentImageUrls(parent: unknown): string[] {
  if (!parent || typeof parent !== "object") return [];
  const value = parent as Record<string, unknown>;
  const normalize = (items: unknown[]): string[] => [
    ...new Set(
      items
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  ];
  if (Array.isArray(value.images)) {
    const images = normalize(value.images);
    if (images.length) return images;
  }
  if (Array.isArray(value.Images)) {
    const records = value.Images.filter(
      (item): item is ImageRecord => !!item && typeof item === "object",
    );
    const images = normalize(
      [...records]
        .sort(
          (a, b) =>
            Number(a.display_order ?? Number.MAX_SAFE_INTEGER) -
            Number(b.display_order ?? Number.MAX_SAFE_INTEGER),
        )
        .map((image) => image.image_url),
    );
    if (images.length) return images;
  }
  return normalize(
    Array.isArray(value.image_url) ? value.image_url : [value.image_url],
  );
}
