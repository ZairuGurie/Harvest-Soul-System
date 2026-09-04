export type UpcomingEvent = {
  id: string;
  title: string;
  event_date?: string | null;
  start_time?: string | null;
  location?: string | null;
  description?: string | null;
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function parseEventDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function eventDay(value?: string | null) {
  const d = parseEventDate(value);
  return d ? d.getDate() : null;
}

export function eventMonthShort(value?: string | null) {
  const d = parseEventDate(value);
  return d ? MONTHS_SHORT[d.getMonth()] : "";
}

export function formatEventDateLong(value?: string | null) {
  const d = parseEventDate(value);
  if (!d) return null;
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatEventWeekday(value?: string | null) {
  const d = parseEventDate(value);
  if (!d) return null;
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

/** Formats DB time (HH:MM or HH:MM:SS) to a readable local-style label. */
export function formatEventTime(value?: string | null) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return value;
  let hours = Number(match[1]);
  const minutes = match[2];
  if (!Number.isFinite(hours)) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${suffix}`;
}

export function isUpcomingOrToday(value?: string | null) {
  const d = parseEventDate(value);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() >= today.getTime();
}
