"use server";

import { resolvePostLoginPath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function setPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect(
      `/auth/set-password?error=${encodeURIComponent(
        "Passwort mindestens 8 Zeichen",
      )}`,
    );
  }
  if (password !== confirm) {
    redirect(
      `/auth/set-password?error=${encodeURIComponent(
        "Passwörter stimmen nicht überein",
      )}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Sitzung abgelaufen. Bitte Einladungs-Link erneut öffnen oder Passwort zurücksetzen.",
      )}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(
      `/auth/set-password?error=${encodeURIComponent(error.message)}`,
    );
  }

  const destination = await resolvePostLoginPath(null);
  redirect(`${destination}?ok=${encodeURIComponent("Passwort gespeichert")}`);
}
