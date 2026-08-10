"use client";

import { setPartnerActiveAction } from "@/app/dashboard/partners/actions";
import type { AdminPartnerListItem } from "@/lib/partner/admin";
import Link from "next/link";

function eur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

type Props = {
  partners: AdminPartnerListItem[];
};

export function PartnerAdminList({ partners }: Props) {
  if (partners.length === 0) {
    return <p className="text-sm text-muted">Noch keine Partner angelegt.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2 pr-3 font-medium">Partner</th>
            <th className="py-2 pr-3 font-medium">Hotel</th>
            <th className="py-2 pr-3 font-medium">Code</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium tabular-nums">Klicks</th>
            <th className="py-2 pr-3 font-medium tabular-nums">Buchungen</th>
            <th className="py-2 pr-3 font-medium tabular-nums">Umsatz</th>
            <th className="py-2 pr-3 font-medium tabular-nums">Provision</th>
            <th className="py-2 font-medium">Aktion</th>
          </tr>
        </thead>
        <tbody>
          {partners.map((partner) => (
            <tr key={partner.id} className="border-b border-line/70">
              <td className="py-2.5 pr-3">
                <Link
                  href={`/dashboard/partners/${partner.id}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {partner.display_name || partner.channel_name}
                </Link>
                <div className="text-xs text-muted">{partner.email}</div>
              </td>
              <td className="py-2.5 pr-3">{partner.hotel_name ?? "—"}</td>
              <td className="py-2.5 pr-3 font-mono text-xs">
                {partner.identifier_key}
              </td>
              <td className="py-2.5 pr-3">
                {partner.is_active ? (
                  <span className="text-emerald-800">aktiv</span>
                ) : (
                  <span className="text-amber-800">deaktiviert</span>
                )}
              </td>
              <td className="py-2.5 pr-3 tabular-nums">
                {partner.clicks_count}
                <div className="text-xs text-muted">
                  heute {partner.clicks_today} · Monat {partner.clicks_month}
                </div>
              </td>
              <td className="py-2.5 pr-3 tabular-nums">
                {partner.bookings_count}
              </td>
              <td className="py-2.5 pr-3 tabular-nums">
                {eur(partner.revenue)}
              </td>
              <td className="py-2.5 pr-3 tabular-nums">
                {eur(partner.commission_total)}
                <div className="text-xs text-muted">
                  {partner.commission_label}
                </div>
              </td>
              <td className="py-2.5">
                <form action={setPartnerActiveAction}>
                  <input type="hidden" name="id" value={partner.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={partner.is_active ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className="rounded border border-line bg-panel px-2 py-1 text-xs font-medium"
                  >
                    {partner.is_active ? "Deaktivieren" : "Freischalten"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
