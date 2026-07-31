import { logoutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div className="space-y-1">
          <p className="text-sm font-medium tracking-wide text-muted uppercase">
            HGAE
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted">
            Attribution & Provisionen
            {user?.email ? ` · ${user.email}` : null}
          </p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="font-medium underline-offset-2 hover:underline">
            Übersicht
          </Link>
          <Link href="/" className="text-muted underline-offset-2 hover:underline">
            Status
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-muted underline-offset-2 hover:underline">
              Abmelden
            </button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
