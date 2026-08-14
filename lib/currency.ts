/**
 * Currency Formatting Helpers for Philippine Peso (PHP / ₱)
 */

export const CURRENCY_SYMBOL = "₱";

export function formatPeso(amount: number | string | undefined | null, fractionDigits = 2): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount || 0);
  if (isNaN(num)) return "₱0.00";

  return `₱${num.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

export function formatPesoCompact(amount: number | string | undefined | null): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount || 0);
  if (isNaN(num)) return "₱0";

  if (Math.abs(num) >= 1_000_000) {
    return `₱${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `₱${(num / 1_000).toFixed(1)}k`;
  }

  return formatPeso(num, 2);
}
