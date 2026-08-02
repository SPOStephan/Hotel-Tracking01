"use server";

import { isStaffUser } from "@/lib/auth/roles";
import { parseReconciliationCsv } from "@/lib/dashboard/csv";
import { isCsvReconciliationEnabled } from "@/lib/settings/app-settings";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function importReconciliationCsvAction(formData: FormData) {
  if (!(await isStaffUser())) {
    redirect("/partner");
  }

  if (!(await isCsvReconciliationEnabled())) {
    redirect("/dashboard?settings_error=CSV-Abgleich%20ist%20deaktiviert");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      `/dashboard/reconciliation?error=${encodeURIComponent("Bitte eine CSV-Datei wählen")}`,
    );
  }

  const text = await file.text();
  const parsed = parseReconciliationCsv(text);

  if (parsed.rows.length === 0) {
    const msg =
      parsed.errors[0] ?? "Keine gültigen Zeilen in der CSV gefunden";
    redirect(`/dashboard/reconciliation?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  let updated = 0;
  let missing = 0;
  const applyErrors: string[] = [...parsed.errors];

  for (const row of parsed.rows) {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: row.status })
      .eq("transaction_id", row.transaction_id)
      .select("id")
      .maybeSingle();

    if (error) {
      applyErrors.push(`${row.transaction_id}: ${error.message}`);
      continue;
    }
    if (!data) {
      missing += 1;
      continue;
    }
    updated += 1;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reconciliation");

  const summary = `updated=${updated};missing=${missing};warnings=${applyErrors.length}`;
  redirect(`/dashboard/reconciliation?ok=${encodeURIComponent(summary)}`);
}
