import { checkHealth } from "@/lib/supabase/health";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const health = await checkHealth();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
          HGAE
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Hotel Group Attribution Engine
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-zinc-600">
          API-first Attribution- und Provisions-Engine — GitHub → Vercel → dein
          Supabase-Projekt.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          Supabase-Status
        </h2>
        <ul className="space-y-1 text-sm text-zinc-700">
          <li>
            Env konfiguriert: <StatusOk ok={health.configured} />
          </li>
          <li>
            Datenbank:{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-zinc-800">
              {health.database}
            </code>
          </li>
          {health.project_ref ? (
            <li>
              Projekt:{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-zinc-800">
                {health.project_ref}
              </code>
            </li>
          ) : null}
          {typeof health.hotels_count === "number" ? (
            <li>Hotels in DB: {health.hotels_count}</li>
          ) : null}
          {health.hint ? (
            <li className="pt-1 text-zinc-500">{health.hint}</li>
          ) : null}
        </ul>
      </section>

      <ul className="space-y-2 text-sm text-zinc-600">
        <li>
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-800">
            GET /api/v1/health
          </code>{" "}
          — Env + DB-Check
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-800">
            POST /api/v1/clicks
          </code>{" "}
          — Touchpoint-Logging
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-800">
            POST /api/v1/conversions
          </code>{" "}
          — Buchungs-Ingestion
        </li>
        <li>
          OPB-Hotel-ID:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-800">
            lohbeckambassador
          </code>{" "}
          <span className="text-zinc-400">(intern auch UUID ok)</span>
        </li>
        <li>
          Schema einmalig:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-800">
            supabase/APPLY_IN_DASHBOARD.sql
          </code>
        </li>
        <li>
          <a
            href="/dashboard"
            className="font-medium text-zinc-900 underline underline-offset-2"
          >
            Dashboard öffnen
          </a>
        </li>
        <li>
          <a
            href="/partner"
            className="font-medium text-zinc-900 underline underline-offset-2"
          >
            Partner-Portal öffnen
          </a>
        </li>
        <li>
          <a
            href="/test/tracker?ref=max123"
            className="font-medium text-zinc-900 underline underline-offset-2"
          >
            Tracker-Testseite öffnen
          </a>
        </li>
      </ul>
    </main>
  );
}

function StatusOk({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok ? "font-medium text-emerald-700" : "font-medium text-amber-700"
      }
    >
      {ok ? "ja" : "nein"}
    </span>
  );
}
