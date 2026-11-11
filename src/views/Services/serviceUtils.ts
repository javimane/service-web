export const getUniqueValues = (items, key) => {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))];
};

export const priceRangeOptions = [
  { id: "all", label: "Todos los precios", min: 0, max: Infinity },
  { id: "0-50000", label: "Hasta $50.000", min: 0, max: 50000 },
  { id: "50000-150000", label: "$50.001 - $150.000", min: 50001, max: 150000 },
  {
    id: "150000-250000",
    label: "$150.001 - $250.000",
    min: 150001,
    max: 250000,
  },
  { id: "250000-plus", label: "Más de $250.000", min: 250001, max: Infinity },
];

export const parsePrice = (price) => {
  if (typeof price === "number") return Number.isFinite(price) ? price : 0;
  if (!price) return 0;
  const cleaned = String(price).replace(/[^\d,.-]/g, "");
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned.replace(/\.(?=\d{3}(?:\.|$))/g, "");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const filterServices = (services, filters) => {
  const searchLower = (filters.search || "").toLowerCase().trim();

  return services.filter((service) => {
    const matchesSearch =
      !searchLower ||
      service.specialty?.toLowerCase().includes(searchLower) ||
      service.name?.toLowerCase().includes(searchLower) ||
      service.category?.toLowerCase().includes(searchLower);

    const matchesCategory =
      filters.category === "All" || service.category === filters.category;
    const matchesProvince =
      filters.province === "All" || service.province === filters.province;
    const matchesCity = filters.city === "All" || service.city === filters.city;

    const priceValue = parsePrice(service.base_price ?? service.price);
    const range = priceRangeOptions.find(
      (option) => option.id === filters.priceRange,
    );
    const matchesPrice =
      !range || range.id === "all"
        ? true
        : priceValue > 0 && priceValue >= range.min && priceValue <= range.max;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesProvince &&
      matchesCity &&
      matchesPrice
    );
  });
};
