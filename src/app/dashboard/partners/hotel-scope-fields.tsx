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
};

/**
 * Server-rendered so the “Alle Hotels” control is always visible in HTML
 * (no client hydration required).
 */
export function HotelScopeFields({
  hotels,
  defaultAllHotels = false,
  defaultHotelId = "",
}: Props) {
  return (
    <fieldset className="space-y-3 sm:col-span-2 rounded-lg border border-line bg-panel/40 p-4">
      <legend className="px-1 text-sm font-medium">Hotel-Zuordnung</legend>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="all_hotels"
          value="on"
          defaultChecked={defaultAllHotels}
          className="mt-0.5 size-4 shrink-0"
        />
        <span>
          <span className="font-medium">Alle Hotels freischalten</span>
          <span className="mt-0.5 block text-xs text-muted">
            Partner-Code gilt für die gesamte Hotelgruppe. Einzelnes Hotel
            darunter nur wählen, wenn dieser Haken nicht gesetzt ist.
          </span>
        </span>
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">Einzelnes Hotel</span>
        <select
          name="hotel_id"
          className="w-full rounded-lg border border-line bg-panel px-3 py-2"
          defaultValue={defaultAllHotels ? "__all__" : defaultHotelId}
        >
          <option value="__all__">Alle Hotels (gruppenweit)</option>
          <option value="" disabled>
            Oder ein Hotel wählen…
          </option>
          {hotels.map((hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.name}
              {hotel.opb_hotel_id ? ` (${hotel.opb_hotel_id})` : ""}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
