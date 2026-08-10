export type ClickGranularity = "day" | "week" | "month";

export const CLICK_STATS_TZ = "Europe/Berlin";

export const GRANULARITY_WINDOWS: Record<
  ClickGranularity,
  { seriesBuckets: number; fetchDays: number }
> = {
  day: { seriesBuckets: 30, fetchDays: 31 },
  week: { seriesBuckets: 12, fetchDays: 12 * 7 + 1 },
  month: { seriesBuckets: 12, fetchDays: 370 },
};

function partNumber(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  return Number(parts.find((p) => p.type === type)?.value);
}

function zonedYmd(date: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLICK_STATS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return {
    y: partNumber(parts, "year"),
    m: partNumber(parts, "month"),
    d: partNumber(parts, "day"),
  };
}

/** Convert a wall-clock time in Europe/Berlin to a UTC Date. */
export function berlinLocalToUtc(
  y: number,
  m: number,
  d: number,
  h = 0,
  min = 0,
  s = 0,
): Date {
  const guess = new Date(Date.UTC(y, m - 1, d, h, min, s));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLICK_STATS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(guess);
  let hour = partNumber(parts, "hour");
  if (hour === 24) hour = 0;
  const asBerlinUtcMs = Date.UTC(
    partNumber(parts, "year"),
    partNumber(parts, "month") - 1,
    partNumber(parts, "day"),
    hour,
    partNumber(parts, "minute"),
    partNumber(parts, "second"),
  );
  const desiredMs = Date.UTC(y, m - 1, d, h, min, s);
  return new Date(guess.getTime() + (desiredMs - asBerlinUtcMs));
}

export function startOfDayBerlin(date: Date): Date {
  const { y, m, d } = zonedYmd(date);
  return berlinLocalToUtc(y, m, d, 0, 0, 0);
}

export function startOfMonthBerlin(date: Date): Date {
  const { y, m } = zonedYmd(date);
  return berlinLocalToUtc(y, m, 1, 0, 0, 0);
}

/** ISO week start (Monday 00:00) in Europe/Berlin. */
export function startOfIsoWeekBerlin(date: Date): Date {
  const { y, m, d } = zonedYmd(date);
  const utcNoon = Date.UTC(y, m - 1, d, 12);
  const dow = new Date(utcNoon).getUTCDay(); // 0=Sun … 6=Sat
  const offsetToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(Date.UTC(y, m - 1, d + offsetToMonday));
  return berlinLocalToUtc(
    monday.getUTCFullYear(),
    monday.getUTCMonth() + 1,
    monday.getUTCDate(),
    0,
    0,
    0,
  );
}

export function addDaysBerlin(start: Date, days: number): Date {
  const { y, m, d } = zonedYmd(start);
  const next = new Date(Date.UTC(y, m - 1, d + days, 12));
  return berlinLocalToUtc(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
    0,
    0,
    0,
  );
}

export function addMonthsBerlin(start: Date, months: number): Date {
  const { y, m } = zonedYmd(start);
  const next = new Date(Date.UTC(y, m - 1 + months, 1, 12));
  return berlinLocalToUtc(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    1,
    0,
    0,
    0,
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function dayKey(date: Date): string {
  const { y, m, d } = zonedYmd(date);
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function monthKey(date: Date): string {
  const { y, m } = zonedYmd(date);
  return `${y}-${pad2(m)}`;
}

export function weekKey(date: Date): string {
  return dayKey(startOfIsoWeekBerlin(date));
}

export function bucketKey(date: Date, granularity: ClickGranularity): string {
  if (granularity === "day") return dayKey(date);
  if (granularity === "week") return weekKey(date);
  return monthKey(date);
}

export function labelForKey(key: string, granularity: ClickGranularity): string {
  if (granularity === "month") {
    const [ys, ms] = key.split("-");
    const y = Number(ys);
    const m = Number(ms);
    return new Intl.DateTimeFormat("de-DE", {
      month: "long",
      year: "numeric",
      timeZone: CLICK_STATS_TZ,
    }).format(berlinLocalToUtc(y, m, 1, 12));
  }

  if (granularity === "week") {
    const [ys, ms, ds] = key.split("-");
    const start = berlinLocalToUtc(Number(ys), Number(ms), Number(ds), 12);
    const end = addDaysBerlin(startOfDayBerlin(start), 6);
    const fmt = new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      timeZone: CLICK_STATS_TZ,
    });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  }

  const [ys, ms, ds] = key.split("-");
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: CLICK_STATS_TZ,
  }).format(berlinLocalToUtc(Number(ys), Number(ms), Number(ds), 12));
}

export function buildSeriesKeys(
  now: Date,
  granularity: ClickGranularity,
  count: number,
): string[] {
  const keys: string[] = [];
  if (granularity === "day") {
    const start = startOfDayBerlin(now);
    for (let i = count - 1; i >= 0; i -= 1) {
      keys.push(dayKey(addDaysBerlin(start, -i)));
    }
    return keys;
  }
  if (granularity === "week") {
    const start = startOfIsoWeekBerlin(now);
    for (let i = count - 1; i >= 0; i -= 1) {
      keys.push(dayKey(addDaysBerlin(start, -i * 7)));
    }
    return keys;
  }
  const start = startOfMonthBerlin(now);
  for (let i = count - 1; i >= 0; i -= 1) {
    keys.push(monthKey(addMonthsBerlin(start, -i)));
  }
  return keys;
}

export function parseClickGranularity(
  value: string | undefined | null,
): ClickGranularity {
  if (value === "week" || value === "month" || value === "day") return value;
  return "day";
}
