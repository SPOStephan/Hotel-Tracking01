import { PartnerLinkGenerator } from "@/app/partner/link-generator";
import { format } from "@/lib/dashboard/format";
import { getPartnerPortalData } from "@/lib/partner/data";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PartnerPage() {
  const data = await getPartnerPortalData();
  if (!data) {
    redirect("/login");
  }

  if (data.inactive) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Zugang deaktiviert
        </h2>
        <p className="max-w-xl text-sm text-muted">
          Dein Partner-Zugang ist derzeit nicht freigeschaltet. Bitte melde dich
          bei der Hotelgruppe, wenn du denkst, dass das ein Fehler ist.
        </p>
      </div>
    );
  }

  const commissionLabel = data.channel.is_commissionable
    ? data.channel.commission_type === "percentage"
      ? `${data.channel.commission_value}\u00A0%`
      : format.eur(Number(data.channel.commission_value ?? 0))
    : "keine Provision";

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {data.channel.name}
        </h2>
        <p className="text-sm text-muted">
          {data.hotelName ? `${data.hotelName} · ` : null}
          {data.channel.type} · Provision: {commissionLabel}
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Umsatz" value={format.eur(data.totals.revenue)} />
        <Kpi label="Buchungen" value={format.int(data.totals.bookings_count)} />
        <Kpi label="Provision" value={format.eur(data.totals.commission)} />
        <Kpi
          label="Klicks"
          value={format.int(data.totals.touchpoints_count)}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Link erzeugen
          </h2>
          <p className="text-sm text-muted">
            Ziel-URL eingeben — wir hängen deinen Partner-Code an.
          </p>
        </div>
        {data.refParam ? (
          <PartnerLinkGenerator refParam={data.refParam} />
        ) : (
          <p className="text-sm text-muted">
            Für diesen Kanal ist kein <code>ref=</code>-Identifier hinterlegt (
            <code>{data.channel.identifier_key}</code>).
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Deine Buchungen
          </h2>
          <p className="text-sm text-muted">
            Nicht stornierte Buchungen über deinen Kanal.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3 font-medium">Zeit</th>
                <th className="py-2 pr-3 font-medium">Transaktion</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Umsatz</th>
                <th className="py-2 font-medium tabular-nums">Provision</th>
              </tr>
            </thead>
            <tbody>
              {data.bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-muted">
                    Noch keine Buchungen.
                  </td>
                </tr>
              ) : (
                data.bookings.map((row) => (
                  <tr key={row.id} className="border-b border-line/70">
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {format.dt(row.created_at)}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs">
                      {row.transaction_id}
                    </td>
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
