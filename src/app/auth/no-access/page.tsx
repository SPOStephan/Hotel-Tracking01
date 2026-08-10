import { logoutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NoAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          HGAE
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Kein Zugang</h1>
        <p className="text-sm text-muted">
          {user?.email
            ? `Das Konto ${user.email} ist weder als Staff noch als Partner hinterlegt.`
            : "Dieses Konto hat keine Rolle in HGAE."}{" "}
          Partner werden nur über die Partner-Verwaltung im Dashboard angelegt —
          nicht manuell in Supabase Auth allein.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/login" className="underline">
          Zum Login
        </Link>
        {user ? (
          <form action={logoutAction}>
            <button type="submit" className="underline">
              Abmelden
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
