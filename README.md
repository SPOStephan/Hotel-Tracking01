# Hotel Group Attribution Engine (HGAE)

Universelle Multi-Channel Marketing Attribution & Commission Engine für Hotelgruppen.

- **Influencer / Affiliates:** Tracking von Buchungen inkl. Provisionsberechnung  
- **Interne Attribution:** Umsatzmessung über KI-Chat, Newsletter, Ads, Organic  
- **Buchungsstrecke:** OnePageBooking (OPB) v5 & v6  

## Stack

| Schicht | Technologie |
|--------|-------------|
| App | Next.js (App Router, TypeScript) |
| Hosting | Vercel (inkl. Edge / Custom Domain) |
| Datenbank & Auth | Supabase (PostgreSQL, RLS) |
| UI (später) | Tailwind CSS + shadcn/ui / Tremor |
| Tracker | `public/hgae-tracker.js` (Vanilla JS, &lt;5KB) |

## Schnellstart

```bash
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY setzen

npm install
npm run dev
```

### Datenbank-Migration

SQL-Migration liegt unter:

`supabase/migrations/20260730000001_initial_schema.sql`

Im Supabase SQL Editor ausführen oder per Supabase CLI:

```bash
npx supabase db push
```

## API

### `POST /api/v1/conversions`

Empfängt OPB-Kaufabschlüsse vom Tracker.

- Deduplizierung über `transaction_id`
- Channel-Matching über `ref=` / `utm_source=` / `channel_identifier`
- Provisionsberechnung bei `is_commissionable`

Beispiel-Body:

```json
{
  "hotel_id": "00000000-0000-0000-0000-000000000000",
  "transaction_id": "OPB-12345",
  "booking_value": 420.5,
  "currency": "EUR",
  "visitor_id": "v_abc123",
  "ref": "max123",
  "utm_source": null,
  "arrival_date": "2026-08-01",
  "departure_date": "2026-08-03",
  "rooms_count": 1,
  "nights_count": 2,
  "raw_payload": {}
}
```

## Tracker einbinden

Quellcode: `src/tracker/hgae-tracker.js` → Build: `npm run build:tracker` → `public/hgae-tracker.js` (~5KB).

```html
<script
  src="https://analytics.eure-hotelgruppe.de/hgae-tracker.js"
  data-hotel-id="YOUR-HOTEL-UUID"
  data-api-base="https://analytics.eure-hotelgruppe.de"
  async
></script>
```

Das Skript:

1. liest `?ref=` (Prio 1) bzw. UTMs (Prio 2),
2. speichert eine 30-Tage-Session (`hgae_session`) in Cookie + LocalStorage,
3. dekoriert Links zu `onepagebooking.com`,
4. horcht auf `dataLayer` `purchase`-Events und POSTet an `/api/v1/conversions`.
5. akzeptiert OPB v5 (`value` als String) und v6 (`value` als Number).

## Projektstruktur (Kern)

```
src/app/api/v1/conversions/   # Conversion API
src/lib/conversions/          # Zod-Validierung & Provision
src/lib/supabase/             # Browser / SSR / Admin Clients
supabase/migrations/          # PostgreSQL Schema + RLS
public/hgae-tracker.js        # Client Tracker
```

## Nächste Schritte

- `POST /api/v1/clicks` — Touchpoint-Logging  
- `POST /api/v1/chat-link` — getaggte KI-Chat-Links  
- Management-Dashboard (ROI, Hotel-Vergleich, Partner-Portal, CSV-Abgleich)  
