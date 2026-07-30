export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
        HGAE
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
        Hotel Group Attribution Engine
      </h1>
      <p className="max-w-xl text-lg leading-relaxed text-zinc-600">
        API-first Attribution- und Provisions-Engine für Influencer-, Affiliate-
        und interne Marketing-Touchpoints — angebunden an OnePageBooking.
      </p>
      <ul className="space-y-2 text-sm text-zinc-600">
        <li>
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-800">
            POST /api/v1/conversions
          </code>{" "}
          — Buchungs-Ingestion mit Deduplizierung & Provision
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-800">
            /hgae-tracker.js
          </code>{" "}
          — Client-Tracker (Cookie / dataLayer / OPB purchase)
        </li>
      </ul>
    </main>
  );
}
