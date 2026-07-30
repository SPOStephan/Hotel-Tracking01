"use client";

import { DEMO_HOTEL_ID } from "@/types/database";
import { useCallback, useEffect, useState } from "react";

type LogLine = { at: string; text: string };

declare global {
  interface Window {
    dataLayer?: unknown[];
    HGAE?: {
      getSession?: () => Record<string, unknown> | null;
      trackClick?: () => Promise<unknown>;
      trackPurchase?: (ecommerce: Record<string, unknown>) => Promise<unknown>;
      init?: (opts?: Record<string, unknown>) => unknown;
    };
  }
}

export default function TrackerTestPage() {
  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [lastResult, setLastResult] = useState<unknown>(null);

  const log = useCallback((text: string) => {
    setLogs((prev) => [
      ...prev,
      { at: new Date().toLocaleTimeString("de-DE"), text },
    ]);
  }, []);

  useEffect(() => {
    // Ensure attribution param is present (tracker reads ?ref= on boot)
    const url = new URL(window.location.href);
    if (!url.searchParams.get("ref")) {
      url.searchParams.set("ref", "max123");
      window.location.replace(url.toString());
      return;
    }

    window.dataLayer = window.dataLayer || [];

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-hgae-test="1"]',
    );
    if (existing) {
      queueMicrotask(() => setReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = "/hgae-tracker.js";
    script.async = true;
    script.dataset.hgaeTest = "1";
    script.dataset.hotelId = DEMO_HOTEL_ID;
    script.dataset.apiBase = window.location.origin;
    script.dataset.debug = "true";
    script.onload = () => {
      log("hgae-tracker.js geladen");
      log(
        `Session: ${JSON.stringify(window.HGAE?.getSession?.() ?? null)}`,
      );
      setReady(true);
    };
    script.onerror = () => log("FEHLER: Tracker-Skript konnte nicht laden");
    document.body.appendChild(script);
  }, [log]);

  async function simulateClick() {
    setLastResult(null);
    log("Sende Klick / Touchpoint …");
    try {
      const result = await window.HGAE?.trackClick?.();
      setLastResult(result ?? null);
      log(`Click-Antwort: ${JSON.stringify(result ?? null)}`);
    } catch (error) {
      log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function simulatePurchase() {
    setLastResult(null);
    const transactionId = `OPB-TEST-${Date.now()}`;
    const ecommerce = {
      transaction_id: transactionId,
      value: "199,50", // OPB v5 string style
      currency: "EUR",
      arrival: "2026-09-01",
      departure: "2026-09-03",
      rooms: 1,
      nights: 2,
    };

    log(`Sende purchase ${transactionId} (OPB-v5-String value „199,50“)`);

    try {
      // Same extract/send path as the dataLayer listener
      const result = await window.HGAE?.trackPurchase?.(ecommerce);
      setLastResult(result ?? null);
      log(`Antwort: ${JSON.stringify(result ?? null)}`);

      // Also demonstrate the production dataLayer hook with a *different* id
      const dlId = `${transactionId}-DL`;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "purchase",
        ecommerce: { ...ecommerce, transaction_id: dlId, value: 210.0 },
      });
      log(`Zusätzlich dataLayer.push mit ${dlId} (OPB-v6 number 210)`);
    } catch (error) {
      log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
          HGAE Test
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Tracker-Test
        </h1>
        <p className="text-zinc-600">
          Simuliert ein OnePageBooking <code>purchase</code>-Event über{" "}
          <code>dataLayer</code> — wie auf der OPB-Dankeseite.
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        <p>
          Hotel-ID:{" "}
          <code className="rounded bg-white px-1.5 py-0.5">{DEMO_HOTEL_ID}</code>
        </p>
        <p>
          Ref:{" "}
          <code className="rounded bg-white px-1.5 py-0.5">max123</code>{" "}
          (Influencer, 10 % Provision)
        </p>
        <p>Status Tracker: {ready ? "bereit" : "lädt…"}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!ready}
          onClick={simulateClick}
          className="rounded-lg border border-zinc-300 bg-white px-5 py-3 text-left text-base font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Klick / Touchpoint loggen
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={simulatePurchase}
          className="rounded-lg bg-zinc-900 px-5 py-3 text-left text-base font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          OPB-Kauf simulieren
        </button>
      </div>

      {lastResult != null ? (
        <pre className="overflow-x-auto rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950">
          {JSON.stringify(lastResult, null, 2)}
        </pre>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900">Log</h2>
        <ul className="space-y-1 font-mono text-xs text-zinc-600">
          {logs.length === 0 ? <li>Noch keine Einträge</li> : null}
          {logs.map((line) => (
            <li key={`${line.at}-${line.text}`}>
              [{line.at}] {line.text}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-zinc-500">
        Danach in Supabase prüfen:{" "}
        <code className="rounded bg-zinc-100 px-1">touchpoints</code> (Klicks)
        bzw. <code className="rounded bg-zinc-100 px-1">bookings</code>{" "}
        (Käufe).
      </p>
    </main>
  );
}
