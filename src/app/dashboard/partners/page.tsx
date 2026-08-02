import { createPartnerAction } from "@/app/dashboard/partners/actions";
import { PartnerAdminList } from "@/app/dashboard/partners/partner-admin-list";
import { listPartnersWithStats } from "@/lib/partner/admin";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function PartnersAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const partners = await listPartnersWithStats();
  const supabase = await createClient();
  const { data: hotels } = await supabase
    .from("hotels")
    .select("id, name, opb_hotel_id")
    .order("name");

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Partner</h2>
        <p className="max-w-2xl text-sm text-muted">
          Influencer/Affiliates anlegen, per E-Mail einladen, freischalten und
          Auswertungen einsehen.
        </p>
      </div>

      {params.error ? (
        <p className="text-sm text-red-700">{params.error}</p>
      ) : null}
      {params.ok ? (
        <p className="text-sm text-emerald-800">{params.ok}</p>
      ) : null}

      <section className="space-y-4">
        <h3 className="font-medium">Partner-Übersicht</h3>
        <PartnerAdminList partners={partners} />
      </section>

      <section className="space-y-4 border-t border-line pt-8">
        <h3 className="font-medium">Neuen Partner anlegen</h3>
        <form
          action={createPartnerAction}
          className="grid max-w-xl gap-3 sm:grid-cols-2"
        >
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium">Anzeigename</span>
            <input
              name="display_name"
              required
              className="w-full rounded-lg border border-line bg-panel px-3 py-2"
              placeholder="Max Mustermann"
            />
          </label>
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium">E-Mail (Login)</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-line bg-panel px-3 py-2"
              placeholder="partner@example.com"
            />
          </label>
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium">Hotel</span>
            <select
              name="hotel_id"
              required
              className="w-full rounded-lg border border-line bg-panel px-3 py-2"
              defaultValue=""
            >
              <option value="" disabled>
                Hotel wählen
              </option>
              {(hotels ?? []).map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                  {hotel.opb_hotel_id ? ` (${hotel.opb_hotel_id})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Partner-Code (ref)</span>
            <input
              name="ref_code"
              required
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 font-mono text-sm"
              placeholder="max123"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Provision %</span>
            <input
              name="commission_percent"
              type="number"
              min={0}
              max={100}
              step="0.1"
              defaultValue={10}
              required
              className="w-full rounded-lg border border-line bg-panel px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="send_invite"
              defaultChecked
              className="size-4"
            />
            <span>
              Einladungs-E-Mail senden (Supabase Auth Invite). Ohne Haken: User
              wird ohne Mail angelegt bzw. bestehender User verknüpft.
            </span>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            >
              Partner anlegen
            </button>
          </div>
        </form>
        <p className="text-sm text-muted">
          Hinweis: Für Einladungsmails muss in Supabase unter{" "}
          <Link
            href="https://supabase.com/dashboard/project/lkqopssstvtekneycpgh/auth/url-configuration"
            className="underline"
            target="_blank"
          >
            Auth → URL Configuration
          </Link>{" "}
          die Site-URL bzw. Redirect{" "}
          <code>https://analytics.lohbeckhotels.de</code> erlaubt sein.
        </p>
      </section>
    </div>
  );
}
