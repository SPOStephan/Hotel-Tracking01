"use client";

import { useState } from "react";

type Props = {
  refParam: string;
  defaultBaseUrl?: string;
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
  defaultBaseUrl = "https://www.example-hotel.de/",
}: Props) {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [copied, setCopied] = useState(false);
  const trackingUrl = buildTrackingUrl(baseUrl, refParam);

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

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">Ziel-URL der Hotel-Website</span>
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 outline-none ring-accent focus:ring-2"
          placeholder="https://www.hotel.de/angebot"
        />
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
          Parameter: <code className="rounded bg-panel px-1">ref={refParam}</code>
        </p>
      </div>
    </div>
  );
}
