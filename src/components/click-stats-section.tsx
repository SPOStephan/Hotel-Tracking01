import type { ClickGranularity, ClickStats } from "@/lib/clicks/stats";
import { format } from "@/lib/dashboard/format";
import Link from "next/link";

type Props = {
  stats: ClickStats;
  /** Base path for period toggle links (query otherParams preserved). */
  basePath: string;
  /** Existing query params to preserve (e.g. hotel filter). */
  preserveParams?: Record<string, string | undefined | null>;
  title?: string;
  description?: string;
  showChannelBreakdown?: boolean;
};

const PERIODS: Array<{ value: ClickGranularity; label: string }> = [
  { value: "day", label: "Tag" },
  { value: "week", label: "Woche" },
  { value: "month", label: "Monat" },
];

function hrefFor(
  basePath: string,
  preserveParams: Record<string, string | undefined | null> | undefined,
  clicks: ClickGranularity,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(preserveParams ?? {})) {
    if (value) params.set(key, value);
  }
  params.set("clicks", clicks);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function periodNoun(granularity: ClickGranularity): string {
  if (granularity === "day") return "Tage";
  if (granularity === "week") return "Wochen";
  return "Monate";
}

export function ClickStatsSection({
  stats,
  basePath,
  preserveParams,
  title = "Klick-Statistik",
  description = "Klicks auf Links mit Partner-/Kanal-Parameter (ref oder utm_source), Zeitzone Europe/Berlin.",
  showChannelBreakdown = false,
}: Props) {
  const maxClicks = Math.max(...stats.series.map((b) => b.clicks), 1);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {PERIODS.map((period) => {
            const active = stats.granularity === period.value;
            return (
              <Link
                key={period.value}
                href={hrefFor(basePath, preserveParams, period.value)}
                className={
                  active
                    ? "rounded-lg bg-stone-900 px-3 py-1.5 font-medium text-white"
                    : "rounded-lg border border-line bg-panel px-3 py-1.5 font-medium"
                }
                aria-current={active ? "page" : undefined}
              >
                {period.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Heute" value={format.int(stats.summary.today)} />
        <Kpi label="Diese Woche" value={format.int(stats.summary.this_week)} />
        <Kpi label="Dieser Monat" value={format.int(stats.summary.this_month)} />
        <Kpi label="Gesamt" value={format.int(stats.summary.all_time)} />
      </div>

      <p className="text-sm text-muted">
        Im gewählten Zeitraum: {format.int(stats.summary.unique_visitors_period)}{" "}
        eindeutige Besucher · Auswertung nach {periodNoun(stats.granularity)}.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3 font-medium">Zeitraum</th>
              <th className="py-2 pr-3 font-medium tabular-nums">Klicks</th>
              <th className="py-2 pr-3 font-medium tabular-nums">
                Unique Visitor
              </th>
              <th className="py-2 font-medium">Verlauf</th>
            </tr>
          </thead>
          <tbody>
            {[...stats.series].reverse().map((row) => (
              <tr key={row.key} className="border-b border-line/70">
                <td className="py-2.5 pr-3 whitespace-nowrap">{row.label}</td>
                <td className="py-2.5 pr-3 tabular-nums">
                  {format.int(row.clicks)}
                </td>
                <td className="py-2.5 pr-3 tabular-nums">
                  {format.int(row.unique_visitors)}
                </td>
                <td className="py-2.5 min-w-[8rem]">
                  <div className="h-2 overflow-hidden rounded-full bg-line/60">
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-500"
                      style={{ width: `${(row.clicks / maxClicks) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showChannelBreakdown ? (
        <div className="space-y-3">
          <div>
            <h3 className="font-medium">Klicks nach Kanal</h3>
            <p className="text-sm text-muted">
              Im gleichen Zeitraum wie die Serie oben.
            </p>
          </div>
          {stats.byChannel.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Klicks im Zeitraum.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="py-2 pr-3 font-medium">Kanal</th>
                    <th className="py-2 pr-3 font-medium">Parameter</th>
                    <th className="py-2 pr-3 font-medium tabular-nums">
                      Klicks
                    </th>
                    <th className="py-2 font-medium tabular-nums">
                      Unique Visitor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byChannel.map((row) => (
                    <tr key={row.channel_id} className="border-b border-line/70">
                      <td className="py-2.5 pr-3">
                        <span className="font-medium">{row.channel_name}</span>
                        <span className="text-muted">
                          {" "}
                          · {row.channel_type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {row.identifier_key}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {format.int(row.clicks)}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        {format.int(row.unique_visitors)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 border-t border-line pt-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}
