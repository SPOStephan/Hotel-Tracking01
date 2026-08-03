"use server";

import { isStaffUser } from "@/lib/auth/roles";
import {
  parseHotelScope,
  parsePartnerOptionalFields,
} from "@/lib/partner/profile-fields";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function normalizeRef(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith("ref=") ? trimmed.slice(4) : trimmed;
}

async function requireStaff() {
  if (!(await isStaffUser())) {
    redirect("/partner");
  }
}

export async function createPartnerAction(formData: FormData) {
  await requireStaff();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const scope = parseHotelScope(formData);
  const refCode = normalizeRef(String(formData.get("ref_code") ?? ""));
  const commissionPercent = Number(
    String(formData.get("commission_percent") ?? "").replace(",", "."),
  );
  const sendInvite = formData.get("send_invite") === "on";
  const optional = parsePartnerOptionalFields(formData);

  if (!email || !email.includes("@")) {
    redirect(
      `/dashboard/partners?error=${encodeURIComponent("Gültige E-Mail nötig")}`,
    );
  }
  if (!displayName) {
    redirect(
      `/dashboard/partners?error=${encodeURIComponent("Anzeigename nötig")}`,
    );
  }
  if (scope.error) {
    redirect(
      `/dashboard/partners?error=${encodeURIComponent(scope.error)}`,
    );
  }
  if (!refCode || !/^[a-z0-9][a-z0-9_-]{1,60}$/.test(refCode)) {
    redirect(
      `/dashboard/partners?error=${encodeURIComponent(
        "Partner-Code ungültig (z. B. max123)",
      )}`,
    );
  }
  if (
    !Number.isFinite(commissionPercent) ||
    commissionPercent < 0 ||
    commissionPercent > 100
  ) {
    redirect(
      `/dashboard/partners?error=${encodeURIComponent(
        "Provision in % zwischen 0 und 100",
      )}`,
    );
  }

  const supabase = await createClient();
  const identifierKey = `ref=${refCode}`;

  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .insert({
      hotel_id: scope.hotelId,
      name: displayName,
      type: "influencer",
      identifier_key: identifierKey,
      is_commissionable: commissionPercent > 0,
      commission_type: commissionPercent > 0 ? "percentage" : null,
      commission_value: commissionPercent > 0 ? commissionPercent : null,
    })
    .select("id")
    .single();

  if (channelError || !channel) {
    const msg =
      channelError?.code === "23505"
        ? "Dieser Partner-Code (ref) existiert bereits"
        : (channelError?.message ?? "Kanal konnte nicht angelegt werden");
    redirect(`/dashboard/partners?error=${encodeURIComponent(msg)}`);
  }

  let userId: string | null = null;
  let inviteNote = "";

  try {
    const admin = createAdminClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "https://analytics.lohbeckhotels.de";

    if (sendInvite) {
      const { data: invited, error: inviteError } =
        await admin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${appUrl}/login`,
          data: { display_name: displayName, role: "partner" },
        });

      if (inviteError) {
        const { data: listed, error: listError } =
          await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (listError) {
          redirect(
            `/dashboard/partners?error=${encodeURIComponent(
              `Einladung fehlgeschlagen: ${inviteError.message}`,
            )}`,
          );
        }
        const existing = listed.users.find(
          (u) => u.email?.toLowerCase() === email,
        );
        if (!existing) {
          redirect(
            `/dashboard/partners?error=${encodeURIComponent(
              `Einladung fehlgeschlagen: ${inviteError.message}`,
            )}`,
          );
        }
        userId = existing.id;
        inviteNote = "bestehender-user";
      } else {
        userId = invited.user?.id ?? null;
        inviteNote = "einladung-gesendet";
      }
    } else {
      const { data: listed, error: listError } = await admin.auth.admin.listUsers(
        { page: 1, perPage: 200 },
      );
      if (listError) {
        redirect(
          `/dashboard/partners?error=${encodeURIComponent(listError.message)}`,
        );
      }
      const existing = listed.users.find(
        (u) => u.email?.toLowerCase() === email,
      );
      if (!existing) {
        const { data: created, error: createError } =
          await admin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { display_name: displayName, role: "partner" },
          });
        if (createError || !created.user) {
          redirect(
            `/dashboard/partners?error=${encodeURIComponent(
              createError?.message ??
                "User konnte nicht angelegt werden. Haken bei Einladung setzen oder User vorher in Supabase Auth anlegen.",
            )}`,
          );
        }
        userId = created.user.id;
        inviteNote = "user-manuell";
      } else {
        userId = existing.id;
        inviteNote = "bestehender-user";
      }
    }
  } catch (error) {
    redirect(
      `/dashboard/partners?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Auth-Fehler",
      )}`,
    );
  }

  if (!userId) {
    redirect(
      `/dashboard/partners?error=${encodeURIComponent("Kein User für Partner")}`,
    );
  }

  {
    const admin = createAdminClient();
    const { data: staffHit, error: staffLookupError } = await admin
      .from("staff_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!staffLookupError && staffHit) {
      redirect(
        `/dashboard/partners?error=${encodeURIComponent(
          "Diese E-Mail ist ein Staff-/Admin-Account. Bitte eine eigene Partner-E-Mail nutzen.",
        )}`,
      );
    }
  }

  const { error: profileError } = await supabase.from("partner_profiles").insert({
    user_id: userId,
    channel_id: channel.id,
    email,
    display_name: displayName,
    is_active: true,
    ...optional,
  });

  if (profileError) {
    redirect(
      `/dashboard/partners?error=${encodeURIComponent(profileError.message)}`,
    );
  }

  revalidatePath("/dashboard/partners");
  redirect(
    `/dashboard/partners?ok=${encodeURIComponent(
      `Partner angelegt (${inviteNote})`,
    )}`,
  );
}

export async function updatePartnerAction(formData: FormData) {
  await requireStaff();

  const id = String(formData.get("id") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const scope = parseHotelScope(formData);
  const commissionPercent = Number(
    String(formData.get("commission_percent") ?? "").replace(",", "."),
  );
  const optional = parsePartnerOptionalFields(formData);

  if (!id) {
    redirect(`/dashboard/partners?error=${encodeURIComponent("Partner-ID fehlt")}`);
  }
  if (!displayName) {
    redirect(
      `/dashboard/partners/${id}?error=${encodeURIComponent("Anzeigename nötig")}`,
    );
  }
  if (scope.error) {
    redirect(
      `/dashboard/partners/${id}?error=${encodeURIComponent(scope.error)}`,
    );
  }
  if (
    !Number.isFinite(commissionPercent) ||
    commissionPercent < 0 ||
    commissionPercent > 100
  ) {
    redirect(
      `/dashboard/partners/${id}?error=${encodeURIComponent(
        "Provision in % zwischen 0 und 100",
      )}`,
    );
  }

  const supabase = await createClient();
  const { data: profile, error: profileLookupError } = await supabase
    .from("partner_profiles")
    .select("id, channel_id")
    .eq("id", id)
    .maybeSingle();

  if (profileLookupError || !profile) {
    redirect(
      `/dashboard/partners?error=${encodeURIComponent(
        profileLookupError?.message ?? "Partner nicht gefunden",
      )}`,
    );
  }

  const { error: channelError } = await supabase
    .from("channels")
    .update({
      hotel_id: scope.hotelId,
      name: displayName,
      is_commissionable: commissionPercent > 0,
      commission_type: commissionPercent > 0 ? "percentage" : null,
      commission_value: commissionPercent > 0 ? commissionPercent : null,
    })
    .eq("id", profile.channel_id);

  if (channelError) {
    redirect(
      `/dashboard/partners/${id}?error=${encodeURIComponent(channelError.message)}`,
    );
  }

  const { error: profileError } = await supabase
    .from("partner_profiles")
    .update({
      display_name: displayName,
      ...optional,
    })
    .eq("id", id);

  if (profileError) {
    redirect(
      `/dashboard/partners/${id}?error=${encodeURIComponent(profileError.message)}`,
    );
  }

  revalidatePath("/dashboard/partners");
  revalidatePath(`/dashboard/partners/${id}`);
  redirect(
    `/dashboard/partners/${id}?ok=${encodeURIComponent("Partner gespeichert")}`,
  );
}

export async function setPartnerActiveAction(formData: FormData) {
  await requireStaff();

  const id = String(formData.get("id") ?? "").trim();
  const active = formData.get("active") === "true";

  if (!id) {
    redirect(`/dashboard/partners?error=${encodeURIComponent("Partner-ID fehlt")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("partner_profiles")
    .update({ is_active: active })
    .eq("id", id);

  if (error) {
    redirect(`/dashboard/partners?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/partners");
  revalidatePath(`/dashboard/partners/${id}`);
  redirect(
    `/dashboard/partners?ok=${encodeURIComponent(
      active ? "Partner freigeschaltet" : "Partner deaktiviert",
    )}`,
  );
}
