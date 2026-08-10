/**
 * Pure helper smoke test for click period bucketing (Europe/Berlin).
 * Run: npx tsx scripts/smoke-click-stats.ts
 */
import {
  berlinLocalToUtc,
  parseClickGranularity,
  startOfDayBerlin,
  startOfIsoWeekBerlin,
  startOfMonthBerlin,
} from "../src/lib/clicks/periods";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

// 2026-08-10 10:00 UTC = 12:00 Berlin (CEST, UTC+2); weekday = Monday
const sample = new Date("2026-08-10T10:00:00.000Z");

const dayStart = startOfDayBerlin(sample);
assert(
  dayStart.toISOString() === "2026-08-09T22:00:00.000Z",
  `startOfDayBerlin expected 2026-08-09T22:00:00.000Z, got ${dayStart.toISOString()}`,
);

const weekStart = startOfIsoWeekBerlin(sample);
assert(
  weekStart.toISOString() === "2026-08-09T22:00:00.000Z",
  `startOfIsoWeekBerlin expected Monday, got ${weekStart.toISOString()}`,
);

const monthStart = startOfMonthBerlin(sample);
assert(
  monthStart.toISOString() === "2026-07-31T22:00:00.000Z",
  `startOfMonthBerlin expected Aug 1 Berlin, got ${monthStart.toISOString()}`,
);

const winter = berlinLocalToUtc(2026, 1, 15, 0, 0, 0);
assert(
  winter.toISOString() === "2026-01-14T23:00:00.000Z",
  `CET offset expected, got ${winter.toISOString()}`,
);

assert(parseClickGranularity("week") === "week", "parse week");
assert(parseClickGranularity("nope") === "day", "default day");

console.log("smoke-click-stats: ok");
