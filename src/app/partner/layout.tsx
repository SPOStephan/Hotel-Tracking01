import { logoutAction } from "@/app/login/actions";
import { isStaffUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const staff = await isStaffUser();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div className="space-y-1">
          <p className="text-sm font-medium tracking-wide text-muted uppercase">
            HGAE Partner
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Partner-Portal
          </h1>
          <p className="text-sm text-muted">
            Deine Links, Klicks, Buchungen und Provisionen
            {user?.email ? ` · ${user.email}` : null}
          </p>
          {!staff ? (
            <p className="max-w-xl text-sm text-muted">
              Das ist die Ansicht für einen einzelnen Partner — nicht die
              Admin-Übersicht der Hotelgruppe. Admin: abmelden und mit dem
              Staff-Account unter /dashboard/partners einloggen.
            </p>
          ) : null}
        </div>
        <nav className="flex items-center gap-4 text-sm">
          {staff ? (
            <Link
              href="/dashboard/partners"
              className="font-medium underline-offset-2 hover:underline"
            >
              Admin: Partner
            </Link>
          ) : null}
          <Link
            href="/partner"
            className="font-medium underline-offset-2 hover:underline"
          >
            Übersicht
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-muted underline-offset-2 hover:underline"
            >
              Abmelden
            </button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
