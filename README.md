# Hotel Group Attribution Engine (HGAE)

Universelle Multi-Channel Marketing Attribution & Commission Engine für Hotelgruppen.

**Hosting-Modell:** Code in **GitHub** → Deploy auf **Vercel** → Daten in **deinem Supabase-Projekt**.  
Keine Cursor-eigene Datenbank.

## Stack

| Schicht | Technologie | Besitz |
|--------|-------------|--------|
| Code | GitHub | dein Repo |
| App / API / Tracker | Vercel | dein Account |
| Domain + SSL | Vercel Custom Domain | deine Domain |
| DB + Auth | Supabase PostgreSQL | **dein** Projekt |

## Setup (einmalig)

### 1. Vercel Environment Variables

Bereits erledigt, falls gesetzt:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://lkqopssstvtekneycpgh.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. Schema in Supabase anlegen (ein Klick im SQL Editor)

1. Öffne: [SQL Editor](https://supabase.com/dashboard/project/lkqopssstvtekneycpgh/sql/new)
2. Inhalt von [`supabase/APPLY_IN_DASHBOARD.sql`](./supabase/APPLY_IN_DASHBOARD.sql) einfügen
3. **Run**

Das legt Tabellen, RLS, Grants und Demo-Hotel/Channels an.

### 3. GitHub → Vercel deployen

Repo mit Vercel verbinden (Root = Projektroot). Nach dem Deploy prüfen:

- Startseite zeigt **Supabase-Status**
- oder `GET /api/v1/health` → `"ok": true`

### 4. Custom Domain (später)

Vercel → Domains → deine Domain hinzufügen (Auto-SSL).

## API

| Route | Zweck |
|-------|--------|
| `GET /api/v1/health` | Env + DB-Erreichbarkeit |
| `POST /api/v1/conversions` | Buchungen vom Tracker |

Demo-Hotel-ID (nach Seed): `a0000000-0000-4000-8000-000000000001`

## Tracker

```html
<script
  src="https://DEINE-VERCEL-DOMAIN/hgae-tracker.js"
  data-hotel-id="a0000000-0000-4000-8000-000000000001"
  data-api-base="https://DEINE-VERCEL-DOMAIN"
  async
></script>
```

Quelle: `src/tracker/hgae-tracker.js` → Build: `npm run build:tracker` → `public/hgae-tracker.js`

## Lokal entwickeln (optional)

Nur nötig auf deinem Rechner — **nicht** für Vercel:

```bash
cp .env.example .env.local
# Keys aus Vercel / Supabase Dashboard eintragen
npm install
npm run dev
```

## Projektstruktur

```
src/app/api/v1/conversions/   # Conversion API
src/app/api/v1/health/        # Connectivity check
src/lib/supabase/             # Env, Clients, Health, Middleware
supabase/migrations/          # Versionierte SQL-Migrationen
supabase/APPLY_IN_DASHBOARD.sql  # Einmal-Apply im Dashboard
supabase/seed.sql             # Demo-Daten
public/hgae-tracker.js        # Client Tracker
```

## Nächste Schritte

- `POST /api/v1/clicks` — Touchpoint-Logging  
- `POST /api/v1/chat-link` — getaggte KI-Chat-Links  
- Management-Dashboard / Partner-Portal / CSV-Abgleich  
