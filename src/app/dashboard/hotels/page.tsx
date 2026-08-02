import { createHotelAction } from "@/app/dashboard/hotels/actions";
import { HotelList } from "@/app/dashboard/hotels/hotel-list";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const APP_BASE =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://analytics.lohbeckhotels.de";

type PageProps = {
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function HotelsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: hotels } = await supabase
    .from("hotels")
    .select("id, name, opb_version, opb_hotel_id, created_at")
    .order("name");

  const rows = (hotels ?? []).map((hotel) => ({
    id: hotel.id,
    name: hotel.name,
    opb_version: hotel.opb_version,
    opb_hotel_id: hotel.opb_hotel_id,
  }));

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Hotels</h2>
        <p className="max-w-2xl text-sm text-muted">
          Anzeigename und OPB-Hotel-ID sind unabhängig. Zum Ändern eines
          bestehenden Hotels auf <strong>Bearbeiten</strong> klicken, Werte
          anpassen und <strong>Änderungen speichern</strong>.
        </p>
      </div>

      {params.error ? (
        <p className="text-sm text-red-700">{params.error}</p>
      ) : null}
      {params.ok ? (
        <p className="text-sm text-emerald-800">{params.ok}</p>
      ) : null}

      <section className="space-y-4">
        <h3 className="font-medium">Vorhandene Hotels</h3>
        <HotelList hotels={rows} appBase={APP_BASE} />
      </section>

      <section className="space-y-4 border-t border-line pt-8">
        <h3 className="font-medium">Neues Hotel anlegen</h3>
        <p className="text-sm text-muted">
          Nur für Hotels, die noch nicht in der Liste stehen.
        </p>
        <form
          action={createHotelAction}
          className="grid max-w-xl gap-3 sm:grid-cols-2"
        >
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium">Anzeigename</span>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-line bg-panel px-3 py-2"
              placeholder="Anzeigename im Dashboard"
            />
          </label>
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium">OPB-Hotel-ID</span>
            <input
              name="opb_hotel_id"
              required
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 font-mono text-sm"
              placeholder="lohbeckambassador"
            />
            <span className="text-muted">
              Technische ID aus OnePageBooking — nicht der Anzeigename.
            </span>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">OPB-Version</span>
            <select
              name="opb_version"
              defaultValue="v6"
              className="w-full rounded-lg border border-line bg-panel px-3 py-2"
            >
              <option value="v6">v6</option>
              <option value="v5">v5</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            >
              Hotel anlegen
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
