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
