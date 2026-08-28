import {
  CLICK_STATS_TZ,
  GRANULARITY_WINDOWS,
  addDaysBerlin,
  bucketKey,
  buildSeriesKeys,
  labelForKey,
  startOfDayBerlin,
  startOfIsoWeekBerlin,
  startOfMonthBerlin,
  type ClickGranularity,
} from "@/lib/clicks/periods";
import { createClient } from "@/lib/supabase/server";

export type { ClickGranularity };
export {
  parseClickGranularity,
  startOfDayBerlin,
  startOfIsoWeekBerlin,
  startOfMonthBerlin,
} from "@/lib/clicks/periods";

export type ClickBucket = {
  key: string;
  label: string;
  clicks: number;
  unique_visitors: number;
};

export type ChannelClickRow = {
  channel_id: string;
  channel_name: string;
  identifier_key: string;
  channel_type: string;
  clicks: number;
  unique_visitors: number;
};

export type ClickStats = {
  timezone: string;
  granularity: ClickGranularity;
  range_start: string;
  range_end: string;
  summary: {
    today: number;
    this_week: number;
    this_month: number;
    all_time: number;
    unique_visitors_period: number;
  };
  series: ClickBucket[];
  byChannel: ChannelClickRow[];
};

type TouchpointRow = {
  id: string;
  channel_id: string;
  visitor_id: string;
  created_at: string;
};

// Supabase limits a single REST response to 1,000 rows by default. Fetch all
// pages in the selected time window so newer rows are never silently truncated.
const TOUCHPOINT_PAGE_SIZE = 1_000;

async function resolveChannelIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  channelIds: string[] | null | undefined,
  hotelId: string | null | undefined,
): Promise<string[] | null> {
  if (channelIds && channelIds.length > 0) return channelIds;
  if (!hotelId) return null;

  const { data: hotelChannels } = await supabase
    .from("channels")
    .select("id")
    .or(`hotel_id.eq.${hotelId},hotel_id.is.null`);
  return (hotelChannels ?? []).map((c) => c.id);
}

export async function getClickStats(options: {
  channelIds?: string[] | null;
  hotelId?: string | null;
  granularity?: ClickGranularity;
  includeChannelBreakdown?: boolean;
}): Promise<ClickStats> {
  const supabase = await createClient();
  const granularity = options.granularity ?? "day";
  const window = GRANULARITY_WINDOWS[granularity];
  const now = new Date();

  const todayStart = startOfDayBerlin(now);
  const weekStart = startOfIsoWeekBerlin(now);
  const monthStart = startOfMonthBerlin(now);
  const rangeStart = addDaysBerlin(todayStart, -(window.fetchDays - 1));
  const rangeEnd = addDaysBerlin(todayStart, 1);

  const scopedIds = await resolveChannelIds(
    supabase,
    options.channelIds,
    options.hotelId,
  );

  let allTimeQuery = supabase
    .from("touchpoints")
    .select("id", { count: "exact", head: true });
  if (scopedIds) {
    if (scopedIds.length === 0) {
      return emptyStats(granularity, rangeStart, rangeEnd, now);
    }
    allTimeQuery = allTimeQuery.in("channel_id", scopedIds);
  }
  const { count: allTimeCount } = await allTimeQuery;

  const touchpoints: TouchpointRow[] = [];
  let offset = 0;
  while (true) {
    let rowsQuery = supabase
      .from("touchpoints")
      .select("id, channel_id, visitor_id, created_at")
      .gte("created_at", rangeStart.toISOString())
      .lt("created_at", rangeEnd.toISOString())
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + TOUCHPOINT_PAGE_SIZE - 1);
    if (scopedIds) {
      rowsQuery = rowsQuery.in("channel_id", scopedIds);
    }

    const { data, error } = await rowsQuery;
    if (error) {
      throw new Error(error.message);
    }

    const page = (data ?? []) as TouchpointRow[];
    touchpoints.push(...page);
    if (page.length < TOUCHPOINT_PAGE_SIZE) break;
    offset += TOUCHPOINT_PAGE_SIZE;
  }

  let today = 0;
  let thisWeek = 0;
  let thisMonth = 0;
  const periodVisitors = new Set<string>();
  const seriesMap = new Map<string, { clicks: number; visitors: Set<string> }>();
  const channelMap = new Map<
    string,
    { clicks: number; visitors: Set<string> }
  >();

  for (const row of touchpoints) {
    const created = new Date(row.created_at);
    if (created >= todayStart) today += 1;
    if (created >= weekStart) thisWeek += 1;
    if (created >= monthStart) thisMonth += 1;

    periodVisitors.add(row.visitor_id);

    const key = bucketKey(created, granularity);
    let bucket = seriesMap.get(key);
    if (!bucket) {
      bucket = { clicks: 0, visitors: new Set() };
      seriesMap.set(key, bucket);
    }
    bucket.clicks += 1;
    bucket.visitors.add(row.visitor_id);

    if (options.includeChannelBreakdown !== false) {
      let channelBucket = channelMap.get(row.channel_id);
      if (!channelBucket) {
        channelBucket = { clicks: 0, visitors: new Set() };
        channelMap.set(row.channel_id, channelBucket);
      }
      channelBucket.clicks += 1;
      channelBucket.visitors.add(row.visitor_id);
    }
  }

  const seriesKeys = buildSeriesKeys(now, granularity, window.seriesBuckets);
  const series: ClickBucket[] = seriesKeys.map((key) => {
    const bucket = seriesMap.get(key);
    return {
      key,
      label: labelForKey(key, granularity),
      clicks: bucket?.clicks ?? 0,
      unique_visitors: bucket?.visitors.size ?? 0,
    };
  });

  let byChannel: ChannelClickRow[] = [];
  if (options.includeChannelBreakdown !== false && channelMap.size > 0) {
    const ids = [...channelMap.keys()];
    const { data: channels } = await supabase
      .from("channels")
      .select("id, name, identifier_key, type")
      .in("id", ids);

    const meta = new Map(
      (channels ?? []).map((c) => [
        c.id as string,
        {
          name: c.name as string,
          identifier_key: c.identifier_key as string,
          type: c.type as string,
        },
      ]),
    );

    byChannel = ids
      .map((id) => {
        const bucket = channelMap.get(id)!;
        const info = meta.get(id);
        return {
          channel_id: id,
          channel_name: info?.name ?? "Unbekannt",
          identifier_key: info?.identifier_key ?? "—",
          channel_type: info?.type ?? "—",
          clicks: bucket.clicks,
          unique_visitors: bucket.visitors.size,
        };
      })
      .sort((a, b) => b.clicks - a.clicks);
  }

  return {
    timezone: CLICK_STATS_TZ,
    granularity,
    range_start: rangeStart.toISOString(),
    range_end: rangeEnd.toISOString(),
    summary: {
      today,
      this_week: thisWeek,
      this_month: thisMonth,
      all_time: allTimeCount ?? 0,
      unique_visitors_period: periodVisitors.size,
    },
    series,
    byChannel,
  };
}

function emptyStats(
  granularity: ClickGranularity,
  rangeStart: Date,
  rangeEnd: Date,
  now: Date,
): ClickStats {
  const window = GRANULARITY_WINDOWS[granularity];
  return {
    timezone: CLICK_STATS_TZ,
    granularity,
    range_start: rangeStart.toISOString(),
    range_end: rangeEnd.toISOString(),
    summary: {
      today: 0,
      this_week: 0,
      this_month: 0,
      all_time: 0,
      unique_visitors_period: 0,
    },
    series: buildSeriesKeys(now, granularity, window.seriesBuckets).map(
      (key) => ({
        key,
        label: labelForKey(key, granularity),
        clicks: 0,
        unique_visitors: 0,
      }),
    ),
    byChannel: [],
  };
}
