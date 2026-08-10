"use client";

import { useMemo, useState } from "react";

export type HotelLinkOption = {
  id: string;
  name: string;
  website_url: string;
};

type Props = {
  refParam: string;
  hotelOptions?: HotelLinkOption[];
  defaultBaseUrl?: string | null;
};

function buildTrackingUrl(baseUrl: string, refParam: string): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("ref", refParam);
    return url.toString();
  } catch {
    const trimmed = baseUrl.trim();
    if (!trimmed) return "";
    const join = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${join}ref=${encodeURIComponent(refParam)}`;
  }
}

export function PartnerLinkGenerator({
  refParam,
  hotelOptions = [],
  defaultBaseUrl = null,
}: Props) {
  const initialUrl =
    defaultBaseUrl?.trim() || hotelOptions[0]?.website_url || "";
  const [selectedHotelId, setSelectedHotelId] = useState(
    hotelOptions.find((h) => h.website_url === initialUrl)?.id ??
      hotelOptions[0]?.id ??
      "",
  );
  const [baseUrl, setBaseUrl] = useState(initialUrl);
  const [copied, setCopied] = useState(false);

  const trackingUrl = useMemo(
    () => buildTrackingUrl(baseUrl, refParam),
    [baseUrl, refParam],
  );

  const showHotelPicker = hotelOptions.length > 1;

  function onHotelChange(hotelId: string) {
    setSelectedHotelId(hotelId);
    const hotel = hotelOptions.find((h) => h.id === hotelId);
    if (hotel) setBaseUrl(hotel.website_url);
  }

  async function copy() {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!initialUrl && hotelOptions.length === 0) {
    return (
      <p className="text-sm text-muted">
        Für dein Hotel ist noch keine Website-URL hinterlegt. Bitte die
        Hotelgruppe unter Hotels im Admin-Dashboard eintragen lassen.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {showHotelPicker ? (
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Hotel</span>
          <select
            value={selectedHotelId}
            onChange={(e) => onHotelChange(e.target.value)}
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 outline-none ring-accent focus:ring-2"
          >
            {hotelOptions.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">Ziel-URL der Hotel-Website</span>
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 outline-none ring-accent focus:ring-2"
          placeholder="https://www.hotel.de/"
        />
        <span className="text-muted">
          Vorausgefüllt aus dem Hotel-Stamm — bei Bedarf z. B. auf eine
          Aktionsseite anpassen.
        </span>
      </label>

      <div className="space-y-1.5 text-sm">
        <span className="font-medium">Dein Tracking-Link</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="block flex-1 overflow-x-auto rounded-lg border border-line bg-panel px-3 py-2 text-xs break-all">
            {trackingUrl || "—"}
          </code>
          <button
            type="button"
            onClick={copy}
            disabled={!trackingUrl}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {copied ? "Kopiert" : "Kopieren"}
          </button>
        </div>
        <p className="text-muted">
          Parameter:{" "}
          <code className="rounded bg-panel px-1">ref={refParam}</code>
        </p>
      </div>
    </div>
  );
}
