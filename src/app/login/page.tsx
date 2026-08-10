import { loginAction } from "@/app/login/actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          HGAE
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Dashboard Login
        </h1>
        <p className="text-muted">
          Interner Zugang zur Attribution- und Provisionsübersicht.
        </p>
      </div>

      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="next" value={params.next || "/dashboard"} />
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
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Passwort</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 outline-none ring-accent focus:ring-2"
          />
        </label>
        {params.error ? (
          <p className="text-sm text-red-700">{params.error}</p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          Anmelden
        </button>
      </form>

      <p className="text-sm text-muted">
        Eingeladen und noch kein Passwort? Nutze den Link in der Mail erneut
        oder{" "}
        <a href="/auth/forgot-password" className="underline">
          Passwort zurücksetzen
        </a>
        .
      </p>
    </main>
  );
}
