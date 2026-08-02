"use server";

import { isStaffUser } from "@/lib/auth/roles";
import { setCsvReconciliationEnabled } from "@/lib/settings/app-settings";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function toggleCsvReconciliationAction(formData: FormData) {
  if (!(await isStaffUser())) {
    redirect("/partner");
  }

  const enabled = formData.get("enabled") === "true";
  const result = await setCsvReconciliationEnabled(enabled);

  if (!result.ok) {
    redirect(
      `/dashboard?settings_error=${encodeURIComponent(result.error)}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reconciliation");
  redirect(
    `/dashboard?settings=${enabled ? "csv_on" : "csv_off"}`,
  );
}
