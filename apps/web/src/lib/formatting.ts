export const formatCurrency = (amount: number) => {
  const dollars = amount / 100;
  const hasCents = amount % 100 !== 0;

  const dollarStr = String(dollars);
  const decimalIndex = dollarStr.indexOf(".");
  const actualFractionDigits =
    decimalIndex === -1 ? 0 : dollarStr.length - decimalIndex - 1;

  const maxFraction = Math.max(
    hasCents ? 2 : 0,
    Math.min(actualFractionDigits, 4),
  );

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: maxFraction,
  }).format(dollars);
};

export const formatDate = (ds: Date | string | null) => {
  if (!ds) return "-";

  return new Date(ds).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format a date stored as UTC midnight (date-only values) to display the correct date
 * regardless of the user's timezone. Use this for dates like payment dates, due dates, etc.
 * that represent a calendar date rather than a specific moment in time.
 */
export const formatDateUTC = (ds: Date | string | null) => {
  if (!ds) return "-";

  return new Date(ds).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

export const formatDateTime = (date: Date | null) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const capitalize = (s: string) => {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export const toDateString = (date: Date) => {
  return date.toISOString().substring(0, 10);
};

const readableCache = new Map();

export function toHumanReadable(status: string) {
  if (readableCache.has(status)) return readableCache.get(status);

  const result = status.split("_").map(capitalize).join(" ");

  readableCache.set(status, result);

  return result;
}
