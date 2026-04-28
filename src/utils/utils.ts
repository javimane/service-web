/**
 * Formats a YYYY-MM-DD date string to a local locale string
 * avoiding timezone shifting by parsing manually.
 */
export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString();
};
