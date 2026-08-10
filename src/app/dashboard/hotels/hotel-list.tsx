"use client";

import {
  deleteHotelAction,
  updateHotelAction,
} from "@/app/dashboard/hotels/actions";
import { useState } from "react";

export type HotelRow = {
  id: string;
  name: string;
  opb_version: "v5" | "v6";
  opb_hotel_id: string | null;
  website_url: string | null;
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
                <p className="text-sm text-muted break-all">
                  Website:{" "}
                  {hotel.website_url ? (
                    <a
                      href={hotel.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      {hotel.website_url}
                    </a>
                  ) : (
                    <span className="text-amber-800">noch nicht hinterlegt</span>
                  )}
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
                <label className="block space-y-1.5 text-sm sm:col-span-2">
                  <span className="font-medium">Website-URL</span>
                  <input
                    name="website_url"
                    type="url"
                    required
                    defaultValue={hotel.website_url ?? ""}
                    placeholder="https://www.hotel.de/"
                    className="w-full rounded-lg border border-line bg-panel px-3 py-2"
                  />
                  <span className="text-muted">
                    Wird Partnern als vorausgefüllter Tracking-Link angeboten.
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

            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-red-800">
                Hotel löschen
              </summary>
              <form
                action={deleteHotelAction}
                className="mt-3 max-w-xl space-y-3 rounded-lg border border-red-200 bg-red-50/40 p-4"
              >
                <input type="hidden" name="id" value={hotel.id} />
                <p className="text-muted">
                  Entfernt das Hotel inkl. zugehöriger Buchungen und
                  hotel-gebundener Kanäle. Zum Bestätigen den exakten
                  Anzeigenamen eingeben:
                </p>
                <label className="block space-y-1.5">
                  <span className="font-medium">{hotel.name}</span>
                  <input
                    name="confirm_name"
                    required
                    autoComplete="off"
                    placeholder="Anzeigename zur Bestätigung"
                    className="w-full rounded-lg border border-line bg-panel px-3 py-2"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white"
                >
                  Endgültig löschen
                </button>
              </form>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
