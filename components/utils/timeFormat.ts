/**
 * Formats time from 24-hour format (HH:MM) to 12-hour format (h:MMam/pm)
 * If already in 12-hour format, returns as-is
 */
export function formatTimeDisplay(t?: string): string {
  if (!t) return "";
  // If already has AM/PM, return as-is (remove extra spaces)
  if (/am|pm|AM|PM/.test(t)) return t.replace(/\s+/g, "");
  // Expect HH:MM (24h)
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const suffix = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${min}${suffix}`;
}

