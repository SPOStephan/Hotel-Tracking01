import { z } from "zod";

export const clickRequestSchema = z.object({
  visitor_id: z.string().trim().min(1).max(200),
  hotel_id: z.string().trim().min(1).max(120).optional().nullable(),
  channel_identifier: z.string().trim().min(1).max(200).optional().nullable(),
  ref: z.string().trim().min(1).max(200).optional().nullable(),
  utm_source: z.string().trim().min(1).max(200).optional().nullable(),
  utm_medium: z.string().trim().max(200).optional().nullable(),
  utm_campaign: z.string().trim().max(200).optional().nullable(),
  landing_page_url: z.string().trim().max(2000).optional().nullable(),
});

export type ClickRequest = z.infer<typeof clickRequestSchema>;
