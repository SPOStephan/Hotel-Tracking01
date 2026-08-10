"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    redirect(
      `/auth/forgot-password?error=${encodeURIComponent("Gültige E-Mail nötig")}`,
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://analytics.lohbeckhotels.de";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/auth/set-password`,
  });

  if (error) {
    redirect(
      `/auth/forgot-password?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(
    `/auth/forgot-password?ok=${encodeURIComponent(
      "Wenn die E-Mail bekannt ist, wurde ein Link zum Zurücksetzen gesendet.",
    )}`,
  );
}
