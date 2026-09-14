# Our Budget

A private, shared budget tracker for two people — a mobile-first installable
web app (PWA), Quick Add shortcut, AI receipt scanning with per-item Me/Her/Shared
splitting, and a running "who owes who" balance.

Not published anywhere. Just for the two of you.

## Stack

- Frontend: Vite + React + TypeScript + Tailwind CSS, installable as a PWA
- Backend: [Supabase](https://supabase.com) (Postgres + Auth + Storage + Realtime + Edge Functions), free tier
- Receipt AI: Anthropic Claude (vision), called from a Supabase Edge Function
- Charts: Recharts

## One-time setup

### 1. Create a Supabase project

Sign up at [supabase.com](https://supabase.com) and create a new project (pick a
region close to you). From **Project Settings → API**, note:

- Project URL
- `anon` public key
- `service_role` secret key (keep this private, never in the frontend)

### 2. Link the Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

### 3. Push the database schema

```bash
npx supabase db push
```

This creates all tables, RLS policies, views, and RPC functions from
`supabase/migrations/`.

### 4. Get an Anthropic API key

Sign up at [console.anthropic.com](https://console.anthropic.com) and create an
API key. Cost is negligible at a few dozen receipt scans a month.

### 5. Deploy the edge functions and set secrets

```bash
npx supabase functions deploy parse-receipt
npx supabase functions deploy generate-recurring

npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase secrets set CRON_SHARED_SECRET=$(openssl rand -hex 24)
```

### 6. Wire up the daily recurring-transactions cron job (optional)

Edit `supabase/migrations/20260914000300_pg_cron_recurring.sql`, replacing
`YOUR_PROJECT_REF` and `YOUR_CRON_SHARED_SECRET` with your real project ref and
the `CRON_SHARED_SECRET` you just set, then:

```bash
npx supabase db push
```

Until you do this, recurring transactions just won't auto-generate daily —
you can still trigger them manually with the "Run now" button on the
Recurring screen.

### 7. Create your two accounts

There's no signup screen on purpose — this app is for exactly two people.

1. In the Supabase Dashboard: **Authentication → Users → Add User**. Create
   both accounts with email + password, and mark email confirmed.
2. In the Supabase Dashboard **SQL Editor**, insert matching profile rows
   (replace the UUIDs with the ones from step 1, and reuse the household id
   already seeded by `supabase/seed.sql`):

   ```sql
   insert into profiles (id, household_id, display_name) values
     ('<user-1-uuid>', '00000000-0000-0000-0000-000000000001', 'Frank'),
     ('<user-2-uuid>', '00000000-0000-0000-0000-000000000001', 'Her Name');
   ```

3. `supabase/seed.sql` also has starter categories — apply it once via the
   SQL Editor (or `npx supabase db push` already ran the migrations; the
   seed only runs automatically for local dev, so run its contents manually
   against the hosted project once).

### 8. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from step 1.

### 9. Deploy the frontend

Push this repo to a private GitHub repo, then connect it to
[Vercel](https://vercel.com) or [Netlify](https://netlify.com) (free tier).
Build command: `npm run build`. Output directory: `dist`. Add
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in
the hosting dashboard.

## Local development

```bash
npm install
npm run dev -- --host   # --host exposes it on your LAN so you can test from your phone
```

## Installing on your phones

**Android (Chrome):** open the deployed URL, tap "Install app" (or the menu
→ Install app). Long-press the installed icon to get a "Quick Add" shortcut
straight into fast expense entry.

**iPhone (Safari):** open the deployed URL, tap Share → Add to Home Screen.
For the Quick Add shortcut, separately navigate Safari to `<your-url>/quick-add`
and Add to Home Screen again — this creates a second icon (name it "Quick Add")
that opens straight into fast entry, since iOS doesn't support app shortcuts
the way Android does.

## Project structure

- `src/features/*` — one folder per feature area (transactions, receipts,
  categories, budgets, accounts, recurring, goals, balance, stats, settings)
- `supabase/migrations/` — the full database schema, RLS policies, and RPC
  functions, applied in order
- `supabase/functions/` — `parse-receipt` (Claude vision receipt scanning)
  and `generate-recurring` (daily recurring-transaction generator)

## Notes on the data model

- Every transaction is split into per-person shares (`transaction_shares`)
  that always sum to 1.0. "Shared 50/50" resolves into two rows at save
  time, so every report/budget/balance query is a plain sum — no
  conditional split logic anywhere downstream.
- The "who owes who" balance is computed on the fly from transactions +
  shares (`get_household_balance`), never stored as a running ledger — so
  editing or deleting a transaction can never leave the balance out of sync.
