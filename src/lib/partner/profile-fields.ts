/** Shared helpers for optional partner profile fields from FormData. */

export type PartnerOptionalInput = {
  website: string | null;
  social_profiles: string | null;
  notes: string | null;
  iban: string | null;
  account_holder: string | null;
};

function emptyToNull(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

export function parsePartnerOptionalFields(
  formData: FormData,
): PartnerOptionalInput {
  const website = emptyToNull(String(formData.get("website") ?? ""));
  const social_profiles = emptyToNull(
    String(formData.get("social_profiles") ?? ""),
  );
  const notes = emptyToNull(String(formData.get("notes") ?? ""));
  const account_holder = emptyToNull(
    String(formData.get("account_holder") ?? ""),
  );
  const ibanRaw = emptyToNull(String(formData.get("iban") ?? ""));
  const iban = ibanRaw
    ? ibanRaw.replace(/\s+/g, "").toUpperCase()
    : null;

  return {
    website,
    social_profiles,
    notes,
    iban,
    account_holder,
  };
}

export function parseHotelScope(formData: FormData): {
  allHotels: boolean;
  hotelId: string | null;
  error: string | null;
} {
  const allHotels =
    formData.get("all_hotels") === "on" ||
    formData.get("all_hotels") === "true";
  const hotelId = String(formData.get("hotel_id") ?? "").trim();

  if (allHotels || hotelId === "__all__") {
    return { allHotels: true, hotelId: null, error: null };
  }
  if (!hotelId) {
    return {
      allHotels: false,
      hotelId: null,
      error: "Hotel auswählen oder „Alle Hotels“ anhaken",
    };
  }
  return { allHotels: false, hotelId, error: null };
}
