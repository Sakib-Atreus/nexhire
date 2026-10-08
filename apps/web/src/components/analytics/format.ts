/** "12%", "4.5%", "0.8%" — one decimal below 10%, whole numbers above; null → "—". */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  // Conversion can exceed 100% when applications arrive without a counted view (e.g. via the API); cap it.
  value = Math.min(value, 100);
  const rounded = value >= 10 || value === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded.toLocaleString('en-US')}%`;
}
