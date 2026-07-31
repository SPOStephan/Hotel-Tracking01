import { format } from "@/lib/dashboard/format";
import { getDashboardMetrics } from "@/lib/dashboard/metrics";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ hotel?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hotelId = params.hotel?.trim() || null;
  const metrics = await getDashboardMetrics(hotelId);
  const maxRevenue = Math.max(...metrics.byChannel.map((r) => r.revenue), 1);

  return (
    <div className="space-y-10">
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Hotel</span>
          <select
            name="hotel"
            defaultValue={hotelId ?? ""}
            className="block min-w-56 rounded-lg border border-line bg-panel px-3 py-2"
          >
            <option value="">Alle Hotels</option>
            {metrics.hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Filtern
        </button>
        {hotelId ? (
          <Link href="/dashboard" className="pb-2 text-sm text-muted underline">
            Filter zurücksetzen
          </Link>
        ) : null}
      </form>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Umsatz" value={format.eur(metrics.totals.revenue)} />
        <Kpi label="Buchungen" value={format.int(metrics.totals.bookings_count)} />
        <Kpi
          label="Provisionen"
          value={format.eur(metrics.totals.commission)}
        />
        <Kpi
          label="Touchpoints"
          value={format.int(metrics.totals.touchpoints_count)}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Umsatz nach Kanal
          </h2>
          <p className="text-sm text-muted">
            Nicht stornierte Buchungen, absteigend nach Umsatz.
          </p>
        </div>
        {metrics.byChannel.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Buchungen.</p>
        ) : (
          <ul className="space-y-4">
            {metrics.byChannel.map((row) => (
              <li key={row.channel_id ?? "unassigned"} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <div>
                    <span className="font-medium">{row.channel_name}</span>
                    <span className="text-muted"> · {row.channel_type}</span>
                  </div>
                  <div className="tabular-nums text-muted">
                    {format.eur(row.revenue)} · {format.int(row.bookings_count)}{" "}
                    Buchungen · {format.eur(row.commission)} Prov.
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line/60">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-500"
                    style={{ width: `${(row.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Letzte Buchungen
          </h2>
          <p className="text-sm text-muted">Die 15 neuesten Einträge.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3 font-medium">Zeit</th>
                <th className="py-2 pr-3 font-medium">Transaktion</th>
                <th className="py-2 pr-3 font-medium">Hotel</th>
                <th className="py-2 pr-3 font-medium">Kanal</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Umsatz</th>
                <th className="py-2 font-medium tabular-nums">Provision</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-muted">
                    Keine Buchungen vorhanden.
                  </td>
                </tr>
              ) : (
                metrics.recentBookings.map((row) => (
                  <tr key={row.id} className="border-b border-line/70">
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {format.dt(row.created_at)}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs">
                      {row.transaction_id}
                    </td>
                    <td className="py-2.5 pr-3">{row.hotel_name}</td>
                    <td className="py-2.5 pr-3">{row.channel_name}</td>
                    <td className="py-2.5 pr-3">{row.status}</td>
                    <td className="py-2.5 pr-3 tabular-nums">
                      {format.eur(row.booking_value)}
                    </td>
                    <td className="py-2.5 tabular-nums">
                      {row.calculated_commission == null
                        ? "—"
                        : format.eur(row.calculated_commission)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
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
