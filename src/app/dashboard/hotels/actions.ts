"use server";

import { isPartnerUser } from "@/lib/auth/roles";
import {
  isValidOpbHotelId,
  isValidOpbVersion,
  normalizeOpbHotelId,
} from "@/lib/hotels/resolve";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createHotelAction(formData: FormData) {
  if (await isPartnerUser()) {
    redirect("/partner");
  }

  const name = String(formData.get("name") ?? "").trim();
  const opbHotelId = normalizeOpbHotelId(
    String(formData.get("opb_hotel_id") ?? ""),
  );
  const opbVersion = String(formData.get("opb_version") ?? "").trim();

  if (!name) {
    redirect(
      `/dashboard/hotels?error=${encodeURIComponent("Name ist Pflicht")}`,
    );
  }
  if (!isValidOpbHotelId(opbHotelId)) {
    redirect(
      `/dashboard/hotels?error=${encodeURIComponent(
        "OPB-Hotel-ID ungültig (z. B. lohbeckambassador)",
      )}`,
    );
  }
  if (!isValidOpbVersion(opbVersion)) {
    redirect(
      `/dashboard/hotels?error=${encodeURIComponent("OPB-Version muss v5 oder v6 sein")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hotels").insert({
    name,
    opb_hotel_id: opbHotelId,
    opb_version: opbVersion,
  });

  if (error) {
    const msg =
      error.code === "23505"
        ? "Diese OPB-Hotel-ID existiert bereits"
        : error.message;
    redirect(`/dashboard/hotels?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/hotels");
  redirect(`/dashboard/hotels?ok=${encodeURIComponent("Hotel angelegt")}`);
}
