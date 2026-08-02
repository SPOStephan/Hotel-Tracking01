import {
  createHotelAction,
  updateHotelAction,
} from "@/app/dashboard/hotels/actions";
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

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Hotels</h2>
        <p className="max-w-2xl text-sm text-muted">
          Anzeigename und OPB-Hotel-ID sind unabhängig. Die OPB-ID kommt in den
          Tracker-Embed (<code>data-hotel-id</code>). Version kannst du bei
          einem OPB-Upgrade jederzeit von v5 auf v6 umstellen.
        </p>
      </div>

      {params.error ? (
        <p className="text-sm text-red-700">{params.error}</p>
      ) : null}
      {params.ok ? (
        <p className="text-sm text-emerald-800">{params.ok}</p>
      ) : null}

      <section className="space-y-4">
        <h3 className="font-medium">Neues Hotel</h3>
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
              placeholder="Hotel Lohbeck Ambassador Düsseldorf"
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

      <section className="space-y-6">
        <h3 className="font-medium">Vorhandene Hotels</h3>
        {(hotels ?? []).length === 0 ? (
          <p className="text-sm text-muted">Noch keine Hotels.</p>
        ) : (
          <ul className="space-y-8">
            {(hotels ?? []).map((hotel) => {
              const hotelKey = hotel.opb_hotel_id || hotel.id;
              const embed = `<script
  src="${APP_BASE}/hgae-tracker.js"
  data-hotel-id="${hotelKey}"
  data-api-base="${APP_BASE}"
  async
></script>`;

              return (
                <li
                  key={hotel.id}
                  className="space-y-4 border-t border-line pt-4"
                >
                  <form
                    action={updateHotelAction}
                    className="grid max-w-xl gap-3 sm:grid-cols-2"
                  >
                    <input type="hidden" name="id" value={hotel.id} />
                    <label className="block space-y-1.5 text-sm sm:col-span-2">
                      <span className="font-medium">Anzeigename</span>
                      <input
                        name="name"
                        required
                        defaultValue={hotel.name}
                        className="w-full rounded-lg border border-line bg-panel px-3 py-2"
                      />
                    </label>
                    <label className="block space-y-1.5 text-sm sm:col-span-2">
                      <span className="font-medium">OPB-Hotel-ID</span>
                      <input
                        name="opb_hotel_id"
                        required
                        defaultValue={hotel.opb_hotel_id ?? ""}
                        className="w-full rounded-lg border border-line bg-panel px-3 py-2 font-mono text-sm"
                      />
                    </label>
                    <label className="block space-y-1.5 text-sm">
                      <span className="font-medium">OPB-Version</span>
                      <select
                        name="opb_version"
                        defaultValue={hotel.opb_version}
                        className="w-full rounded-lg border border-line bg-panel px-3 py-2"
                      >
                        <option value="v6">v6</option>
                        <option value="v5">v5</option>
                      </select>
                    </label>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="rounded-lg border border-line bg-panel px-4 py-2 text-sm font-medium"
                      >
                        Änderungen speichern
                      </button>
                    </div>
                  </form>

                  <div className="space-y-1.5 text-sm">
                    <p className="font-medium">Embed-Code</p>
                    <pre className="overflow-x-auto rounded-lg border border-line bg-panel p-3 text-xs whitespace-pre-wrap">
                      {embed}
                    </pre>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
