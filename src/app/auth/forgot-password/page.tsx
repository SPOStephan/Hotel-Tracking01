import { forgotPasswordAction } from "@/app/auth/forgot-password/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          HGAE
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Passwort zurücksetzen
        </h1>
        <p className="text-sm text-muted">
          Wir senden einen Link per E-Mail. Danach kannst du ein neues Passwort
          festlegen.
        </p>
      </div>

      {params.error ? (
        <p className="text-sm text-red-700">{params.error}</p>
      ) : null}
      {params.ok ? (
        <p className="text-sm text-emerald-800">{params.ok}</p>
      ) : null}

      <form action={forgotPasswordAction} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">E-Mail</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 outline-none ring-accent focus:ring-2"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          Link senden
        </button>
      </form>

      <p className="text-sm">
        <Link href="/login" className="underline">
          Zurück zum Login
        </Link>
      </p>
    </main>
  );
}
