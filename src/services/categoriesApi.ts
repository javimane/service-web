export const CATEGORIES_API_ENDPOINTS = {
  listCategories: "https://api.localcomercial.dev/v1/categories",
  listProfiles: "https://api.localcomercial.dev/v1/profiles",
  profileDetail: "https://api.localcomercial.dev/v1/profiles/:profileId",
  profilesByCategory:
    "https://api.localcomercial.dev/v1/categories/:categorySlug/profiles",
  provinces: "https://api.localcomercial.dev/v1/locations/provinces",
  citiesByProvince:
    "https://api.localcomercial.dev/v1/locations/cities?province=:province",
  featuredProfiles:
    "https://api.localcomercial.dev/v1/profiles/featured?category=:categorySlug",
};
