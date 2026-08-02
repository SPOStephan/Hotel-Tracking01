import { z } from "zod";

/** Coerce OPB v5 string values and v6 numbers into a finite number. */
const bookingValueSchema = z
  .union([z.number(), z.string()])
  .transform((value, ctx) => {
    const parsed =
      typeof value === "number" ? value : Number(String(value).replace(",", "."));

    if (!Number.isFinite(parsed) || parsed < 0) {
      ctx.addIssue({
        code: "custom",
        message: "booking_value must be a non-negative number",
      });
      return z.NEVER;
    }

    return Math.round(parsed * 100) / 100;
  });

const optionalDateSchema = z.preprocess((value) => {
  if (value == null || value === "") return null;
  return value;
}, z.union([z.iso.date(), z.null()]));

const optionalNonNegativeInt = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null || value === "") return null;
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      ctx.addIssue({
        code: "custom",
        message: "must be a non-negative integer",
      });
      return z.NEVER;
    }
    return parsed;
  });

/** Internal UUID or OnePageBooking hotel id/slug (e.g. lohbeckambassador). */
const hotelRefSchema = z
  .string()
  .trim()
  .min(1)
  .max(120);

export const conversionRequestSchema = z.object({
  hotel_id: hotelRefSchema,
  transaction_id: z.string().trim().min(1).max(200),
  booking_value: bookingValueSchema,
  currency: z
    .string()
    .trim()
    .min(1)
    .max(8)
    .default("EUR")
    .transform((value) => value.toUpperCase()),
  visitor_id: z.string().trim().min(1).max(200).optional().nullable(),
  channel_identifier: z.string().trim().min(1).max(200).optional().nullable(),
  ref: z.string().trim().min(1).max(200).optional().nullable(),
  utm_source: z.string().trim().min(1).max(200).optional().nullable(),
  utm_medium: z.string().trim().max(200).optional().nullable(),
  utm_campaign: z.string().trim().max(200).optional().nullable(),
  arrival_date: optionalDateSchema.optional().default(null),
  departure_date: optionalDateSchema.optional().default(null),
  rooms_count: optionalNonNegativeInt.optional().default(null),
  nights_count: optionalNonNegativeInt.optional().default(null),
  raw_payload: z.record(z.string(), z.unknown()).optional().default({}),
});

export type ConversionRequest = z.infer<typeof conversionRequestSchema>;

/**
 * Build ordered candidate keys for channel matching.
 * Priority: explicit channel_identifier → ref=… → utm_source=…
 */
export function buildChannelLookupKeys(input: {
  channel_identifier?: string | null;
  ref?: string | null;
  utm_source?: string | null;
}): string[] {
  const keys: string[] = [];

  if (input.channel_identifier) {
    keys.push(input.channel_identifier);
  }

  if (input.ref) {
    const normalized = input.ref.startsWith("ref=")
      ? input.ref
      : `ref=${input.ref}`;
    keys.push(normalized);
    if (!input.ref.startsWith("ref=")) {
      keys.push(input.ref);
    }
  }

  if (input.utm_source) {
    const normalized = input.utm_source.startsWith("utm_source=")
      ? input.utm_source
      : `utm_source=${input.utm_source}`;
    keys.push(normalized);
    if (!input.utm_source.startsWith("utm_source=")) {
      keys.push(input.utm_source);
    }
  }

  return [...new Set(keys)];
}
