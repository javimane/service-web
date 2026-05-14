export const getUniqueValues = (items, key) => {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))];
};

export const priceRangeOptions = [
  { id: "all", label: "Todos los precios", min: 0, max: Infinity },
  { id: "0-600", label: "Hasta $600", min: 0, max: 600 },
  { id: "601-900", label: "$601 - $900", min: 601, max: 900 },
  { id: "901-1200", label: "$901 - $1,200", min: 901, max: 1200 },
  { id: "1201-9999", label: "Más de $1,200", min: 1201, max: Infinity },
];

export const parsePrice = (price) => {
  if (!price) return 0;
  const numeric = Number(price.replace(/[^\d]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
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

    const priceValue = parsePrice(service.price);
    const range = priceRangeOptions.find(
      (option) => option.id === filters.priceRange,
    );
    const matchesPrice = range
      ? priceValue >= range.min && priceValue <= range.max
      : true;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesProvince &&
      matchesCity &&
      matchesPrice
    );
  });
};
