const parseDateInput = (value: string): [number, number, number] => {
  const [year, month, day] = value.split("-").map(Number);
  return [year, month - 1, day];
};

// Date inputs are calendar dates in the browser's local time zone.
export const localDateStartUtc = (value: string): string =>
  new Date(...parseDateInput(value)).toISOString();

export const localDateNextDayUtc = (value: string): string => {
  const [year, month, day] = parseDateInput(value);
  return new Date(year, month, day + 1).toISOString();
};

export const localDateInputValue = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
