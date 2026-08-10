/**
 * Normalize/validate a hotel website URL for storage and link generation.
 * Returns https URL or an error message.
 */
export function parseWebsiteUrl(raw: string):
  | { ok: true; url: string }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Website-URL ist Pflicht" };
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: "Website-URL ungültig" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Website-URL muss http(s) sein" };
  }

  return { ok: true, url: parsed.toString() };
}
