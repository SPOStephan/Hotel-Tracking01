"use client";

import { useState } from "react";

export type HotelOption = {
  id: string;
  name: string;
  opb_hotel_id: string | null;
};

type Props = {
  hotels: HotelOption[];
  /** When true, partner applies to all hotels (channel.hotel_id = null). */
  defaultAllHotels?: boolean;
  defaultHotelId?: string;
  /** Prefix for unique ids when multiple forms are on one page. */
  idPrefix?: string;
};

export function HotelScopeFields({
  hotels,
  defaultAllHotels = false,
  defaultHotelId = "",
  idPrefix = "partner",
}: Props) {
  const [allHotels, setAllHotels] = useState(defaultAllHotels);

  return (
    <div className="space-y-3 sm:col-span-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="all_hotels"
          checked={allHotels}
          onChange={(event) => setAllHotels(event.target.checked)}
          className="size-4"
        />
        <span>Alle Hotels freischalten</span>
      </label>
      <p className="text-xs text-muted">
        Mit Haken gilt der Partner-Code gruppenweit. Ohne Haken ein einzelnes
        Hotel wählen.
      </p>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">Hotel</span>
        <select
          id={`${idPrefix}-hotel`}
          name="hotel_id"
          required={!allHotels}
          disabled={allHotels}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={defaultHotelId}
        >
          <option value="" disabled>
            Hotel wählen
          </option>
          {hotels.map((hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.name}
              {hotel.opb_hotel_id ? ` (${hotel.opb_hotel_id})` : ""}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
