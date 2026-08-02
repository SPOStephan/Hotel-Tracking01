import { importReconciliationCsvAction } from "@/app/dashboard/reconciliation/actions";
import { isCsvReconciliationEnabled } from "@/lib/settings/app-settings";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function ReconciliationPage({ searchParams }: PageProps) {
  const enabled = await isCsvReconciliationEnabled();
  if (!enabled) {
    redirect("/dashboard?settings_error=CSV-Abgleich%20ist%20deaktiviert");
  }

  const params = await searchParams;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">CSV-Abgleich</h2>
        <p className="max-w-2xl text-sm text-muted">
          Optionaler Monatsabgleich mit dem Hotel-PMS. Exportiere Buchungen,
          markiere in der CSV den <code>status</code> (
          <code>verified</code> / <code>cancelled</code> / <code>paid</code> /
          <code>pending</code>) und lade die Datei wieder hoch.
        </p>
      </div>

      {params.error ? (
        <p className="text-sm text-red-700">{params.error}</p>
      ) : null}
      {params.ok ? (
        <p className="text-sm text-emerald-800">Import ok: {params.ok}</p>
      ) : null}

      <section className="space-y-3">
        <h3 className="font-medium">1. Export</h3>
        <a
          href="/dashboard/reconciliation/export"
          className="inline-block rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Buchungen als CSV herunterladen
        </a>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">2. Import (Status aktualisieren)</h3>
        <p className="text-sm text-muted">
          Mindestens Spalten: <code>transaction_id,status</code>
        </p>
        <form
          action={importReconciliationCsvAction}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">CSV-Datei</span>
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="block w-full text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg border border-line bg-panel px-4 py-2 text-sm font-medium"
          >
            CSV einspielen
          </button>
        </form>
      </section>

      <p className="text-sm text-muted">
        Feature wieder ausschalten:{" "}
        <Link href="/dashboard" className="underline">
          zurück zum Dashboard
        </Link>{" "}
        → Schalter „CSV-Abgleich“.
      </p>
    </div>
  );
}
