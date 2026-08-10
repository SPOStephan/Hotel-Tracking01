import { setPasswordAction } from "@/app/auth/set-password/actions";
import { SessionFromHash } from "@/app/auth/set-password/session-from-hash";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; reason?: string }>;
};

export default async function SetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reason =
    params.reason === "recovery" ? "Passwort zurücksetzen" : "Passwort festlegen";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          HGAE
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{reason}</h1>
        <p className="text-sm text-muted">
          {user
            ? `Angemeldet als ${user.email}. Bitte ein Passwort wählen, dann geht’s weiter ins Portal.`
            : "Einladungs-Link wird geprüft. Wenn nichts passiert: Link aus der Mail erneut öffnen oder Passwort zurücksetzen."}
        </p>
      </div>

      <SessionFromHash />

      {params.error ? (
        <p className="text-sm text-red-700">{params.error}</p>
      ) : null}

      {user ? (
        <form action={setPasswordAction} className="space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Neues Passwort</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 outline-none ring-accent focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Passwort wiederholen</span>
            <input
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 outline-none ring-accent focus:ring-2"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            Passwort speichern und weiter
          </button>
        </form>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-muted">
            Keine gültige Sitzung. Nutze den Link aus der Einladungs-Mail erneut
            (nur einmal gültig) oder setze das Passwort zurück.
          </p>
          <p>
            <Link href="/auth/forgot-password" className="underline">
              Passwort zurücksetzen
            </Link>
            {" · "}
            <Link href="/login" className="underline">
              Zum Login
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
