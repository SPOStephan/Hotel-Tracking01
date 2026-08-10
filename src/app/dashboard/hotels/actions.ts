"use server";

import { isStaffUser } from "@/lib/auth/roles";
import {
  isValidOpbHotelId,
  isValidOpbVersion,
  normalizeOpbHotelId,
} from "@/lib/hotels/resolve";
import { parseWebsiteUrl } from "@/lib/hotels/website-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createHotelAction(formData: FormData) {
  if (!(await isStaffUser())) {
    redirect("/partner");
  }

  const name = String(formData.get("name") ?? "").trim();
  const opbHotelId = normalizeOpbHotelId(
    String(formData.get("opb_hotel_id") ?? ""),
  );
  const opbVersion = String(formData.get("opb_version") ?? "").trim();
  const website = parseWebsiteUrl(String(formData.get("website_url") ?? ""));

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
  if (!website.ok) {
    redirect(`/dashboard/hotels?error=${encodeURIComponent(website.error)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hotels").insert({
    name,
    opb_hotel_id: opbHotelId,
    opb_version: opbVersion,
    website_url: website.url,
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

export async function updateHotelAction(formData: FormData) {
  if (!(await isStaffUser())) {
    redirect("/partner");
  }

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const opbHotelId = normalizeOpbHotelId(
    String(formData.get("opb_hotel_id") ?? ""),
  );
  const opbVersion = String(formData.get("opb_version") ?? "").trim();
  const website = parseWebsiteUrl(String(formData.get("website_url") ?? ""));

  if (!id) {
    redirect(`/dashboard/hotels?error=${encodeURIComponent("Hotel-ID fehlt")}`);
  }
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
  if (!website.ok) {
    redirect(`/dashboard/hotels?error=${encodeURIComponent(website.error)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("hotels")
    .update({
      name,
      opb_hotel_id: opbHotelId,
      opb_version: opbVersion,
      website_url: website.url,
    })
    .eq("id", id);

  if (error) {
    const msg =
      error.code === "23505"
        ? "Diese OPB-Hotel-ID existiert bereits"
        : error.message;
    redirect(`/dashboard/hotels?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/hotels");
  redirect(`/dashboard/hotels?ok=${encodeURIComponent("Hotel gespeichert")}`);
}

export async function deleteHotelAction(formData: FormData) {
  if (!(await isStaffUser())) {
    redirect("/partner");
  }

  const id = String(formData.get("id") ?? "").trim();
  const confirmName = String(formData.get("confirm_name") ?? "").trim();

  if (!id) {
    redirect(`/dashboard/hotels?error=${encodeURIComponent("Hotel-ID fehlt")}`);
  }

  const supabase = await createClient();
  const { data: hotel, error: loadError } = await supabase
    .from("hotels")
    .select("id, name, opb_hotel_id")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !hotel) {
    redirect(
      `/dashboard/hotels?error=${encodeURIComponent(
        loadError?.message ?? "Hotel nicht gefunden",
      )}`,
    );
  }

  if (confirmName !== hotel.name) {
    redirect(
      `/dashboard/hotels?error=${encodeURIComponent(
        "Löschen abgebrochen: Name zur Bestätigung stimmt nicht",
      )}`,
    );
  }

  // Service role: bookings.hotel_id is ON DELETE RESTRICT; channels cascade.
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    redirect(
      `/dashboard/hotels?error=${encodeURIComponent(
        "Server-Konfiguration fehlt (Service Role)",
      )}`,
    );
  }

  const { error: bookingsError } = await admin
    .from("bookings")
    .delete()
    .eq("hotel_id", id);

  if (bookingsError) {
    redirect(
      `/dashboard/hotels?error=${encodeURIComponent(
        `Buchungen konnten nicht gelöscht werden: ${bookingsError.message}`,
      )}`,
    );
  }

  const { error } = await admin.from("hotels").delete().eq("id", id);

  if (error) {
    redirect(`/dashboard/hotels?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/hotels");
  redirect(
    `/dashboard/hotels?ok=${encodeURIComponent(
      `Hotel „${hotel.name}“ gelöscht`,
    )}`,
  );
}
