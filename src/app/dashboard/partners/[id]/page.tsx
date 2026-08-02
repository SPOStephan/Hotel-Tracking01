import { setPartnerActiveAction } from "@/app/dashboard/partners/actions";
import { format } from "@/lib/dashboard/format";
import { getPartnerAdminDetail } from "@/lib/partner/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PartnerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const partner = await getPartnerAdminDetail(id);
  if (!partner) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm">
          <Link href="/dashboard/partners" className="underline">
            ← Alle Partner
          </Link>
        </p>
        <h2 className="text-xl font-semibold tracking-tight">
          {partner.display_name || partner.channel_name}
        </h2>
        <p className="text-sm text-muted">
          {partner.email} · {partner.hotel_name ?? "ohne Hotel"} ·{" "}
          <code>{partner.identifier_key}</code> · Provision{" "}
          {partner.commission_label} ·{" "}
          {partner.is_active ? "aktiv" : "deaktiviert"}
        </p>
      </div>

      <form action={setPartnerActiveAction}>
        <input type="hidden" name="id" value={partner.id} />
        <input
          type="hidden"
          name="active"
          value={partner.is_active ? "false" : "true"}
        />
        <button
          type="submit"
          className="rounded-lg border border-line bg-panel px-4 py-2 text-sm font-medium"
        >
          {partner.is_active ? "Partner deaktivieren" : "Partner freischalten"}
        </button>
      </form>

      <section className="grid gap-6 sm:grid-cols-3">
        <Kpi label="Buchungen" value={format.int(partner.bookings_count)} />
        <Kpi label="Umsatz" value={format.eur(partner.revenue)} />
        <Kpi label="Provision" value={format.eur(partner.commission_total)} />
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Buchungen</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
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
              {partner.bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-muted">
                    Noch keine Buchungen.
                  </td>
                </tr>
              ) : (
                partner.bookings.map((row) => (
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
