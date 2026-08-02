"use client";

import { updateHotelAction } from "@/app/dashboard/hotels/actions";
import { useState } from "react";

export type HotelRow = {
  id: string;
  name: string;
  opb_version: "v5" | "v6";
  opb_hotel_id: string | null;
};

type Props = {
  hotels: HotelRow[];
  appBase: string;
};

export function HotelList({ hotels, appBase }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (hotels.length === 0) {
    return <p className="text-sm text-muted">Noch keine Hotels.</p>;
  }

  return (
    <ul className="space-y-6">
      {hotels.map((hotel) => {
        const hotelKey = hotel.opb_hotel_id || hotel.id;
        const embed = `<script
  src="${appBase}/hgae-tracker.js"
  data-hotel-id="${hotelKey}"
  data-api-base="${appBase}"
  async
></script>`;
        const isEditing = editingId === hotel.id;

        return (
          <li key={hotel.id} className="space-y-3 border-t border-line pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-lg font-semibold tracking-tight">
                  {hotel.name}
                </p>
                <p className="text-sm text-muted">
                  OPB-ID:{" "}
                  <code className="rounded bg-panel px-1.5 py-0.5">
                    {hotel.opb_hotel_id ?? "—"}
                  </code>{" "}
                  · Version: {hotel.opb_version}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingId((current) =>
                    current === hotel.id ? null : hotel.id,
                  )
                }
                className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm font-medium"
                aria-label={
                  isEditing ? "Bearbeiten schließen" : "Hotel bearbeiten"
                }
              >
                {isEditing ? "Schließen" : "✎ Bearbeiten"}
              </button>
            </div>

            {isEditing ? (
              <form
                action={updateHotelAction}
                className="grid max-w-xl gap-3 rounded-lg border border-line bg-panel/60 p-4 sm:grid-cols-2"
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
                  <span className="text-muted">
                    Technische ID aus OnePageBooking (z. B. lohbeckambassador).
                  </span>
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
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Änderungen speichern
                  </button>
                </div>
              </form>
            ) : null}

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
  );
}
