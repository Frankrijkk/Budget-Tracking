-- Core schema for the shared household budget tracker.
-- Exactly one household, exactly two profiles (Me / Her) will ever exist in this data set.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- households / profiles
-- ---------------------------------------------------------------------------

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Household',
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  display_name text not null,
  avatar_color text,
  created_at timestamptz not null default now()
);

create index profiles_household_id_idx on profiles (household_id);

-- ---------------------------------------------------------------------------
-- accounts (wallets)
-- ---------------------------------------------------------------------------

create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  owner_id uuid references profiles (id) on delete set null, -- null = shared account
  name text not null,
  type text not null check (type in ('cash', 'card', 'savings', 'other')),
  icon text,
  color text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index accounts_household_id_idx on accounts (household_id);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  monthly_budget numeric(12, 2),
  is_archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create index categories_household_id_idx on categories (household_id);

-- ---------------------------------------------------------------------------
-- receipts
-- ---------------------------------------------------------------------------

create table receipts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  store_name text,
  receipt_date date,
  payer_id uuid not null references profiles (id),
  account_id uuid references accounts (id),
  image_path text,
  raw_ai_response jsonb,
  total_amount numeric(12, 2),
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create index receipts_household_id_idx on receipts (household_id);

-- ---------------------------------------------------------------------------
-- recurring_transactions (forward-declared, transactions references it)
-- ---------------------------------------------------------------------------

create table recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  account_id uuid not null references accounts (id),
  category_id uuid references categories (id),
  payer_id uuid not null references profiles (id),
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  interval_count int not null default 1 check (interval_count > 0),
  day_of_month int check (day_of_month between 1 and 31),
  weekday int check (weekday between 0 and 6),
  start_date date not null,
  end_date date,
  next_run_date date not null,
  default_share_type text not null default 'shared' check (default_share_type in ('me', 'her', 'shared')),
  default_ratio numeric(5, 4) not null default 0.5 check (default_ratio >= 0 and default_ratio <= 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index recurring_transactions_household_id_idx on recurring_transactions (household_id);
create index recurring_transactions_next_run_date_idx on recurring_transactions (next_run_date) where is_active;

-- ---------------------------------------------------------------------------
-- transactions (one row per line item; manual entries have exactly one)
-- ---------------------------------------------------------------------------

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  receipt_id uuid references receipts (id) on delete cascade,
  account_id uuid not null references accounts (id),
  category_id uuid references categories (id),
  payer_id uuid not null references profiles (id),
  description text not null default '',
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  occurred_on date not null,
  note text,
  recurring_transaction_id uuid references recurring_transactions (id) on delete set null,
  is_settlement boolean not null default false,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_household_occurred_idx on transactions (household_id, occurred_on desc);
create index transactions_category_idx on transactions (category_id);
create index transactions_payer_idx on transactions (payer_id);
create index transactions_receipt_idx on transactions (receipt_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger transactions_set_updated_at
before update on transactions
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- transaction_shares (the split table)
-- ---------------------------------------------------------------------------

create table transaction_shares (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions (id) on delete cascade,
  profile_id uuid not null references profiles (id),
  share_type text not null check (share_type in ('me', 'her', 'shared')),
  ratio numeric(5, 4) not null check (ratio >= 0 and ratio <= 1),
  unique (transaction_id, profile_id)
);

create index transaction_shares_transaction_idx on transaction_shares (transaction_id);
create index transaction_shares_profile_idx on transaction_shares (profile_id);

-- Enforce sum(ratio) = 1.0 per transaction. Deferred so a multi-row insert
-- (delete-all-then-reinsert-shares, or insert-two-rows-for-a-split) can be
-- validated at COMMIT/statement end rather than after the first row lands.
create or replace function check_transaction_shares_sum()
returns trigger
language plpgsql
as $$
declare
  affected_transaction_id uuid;
  total numeric(6, 4);
begin
  affected_transaction_id := coalesce(new.transaction_id, old.transaction_id);

  select sum(ratio) into total
  from transaction_shares
  where transaction_id = affected_transaction_id;

  if total is not null and abs(total - 1.0) > 0.0001 then
    raise exception 'transaction_shares for transaction % must sum to 1.0, got %',
      affected_transaction_id, total;
  end if;

  return null;
end;
$$;

create constraint trigger transaction_shares_sum_check
after insert or update or delete on transaction_shares
deferrable initially deferred
for each row execute function check_transaction_shares_sum();

-- ---------------------------------------------------------------------------
-- savings_goals / savings_goal_contributions
-- ---------------------------------------------------------------------------

create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  icon text,
  color text,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0,
  target_date date,
  is_achieved boolean not null default false,
  created_at timestamptz not null default now()
);

create index savings_goals_household_idx on savings_goals (household_id);

create table savings_goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references savings_goals (id) on delete cascade,
  profile_id uuid not null references profiles (id),
  amount numeric(12, 2) not null,
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index savings_goal_contributions_goal_idx on savings_goal_contributions (goal_id);

create or replace function refresh_savings_goal_total()
returns trigger
language plpgsql
as $$
declare
  affected_goal_id uuid;
  total numeric(12, 2);
begin
  affected_goal_id := coalesce(new.goal_id, old.goal_id);

  select coalesce(sum(amount), 0) into total
  from savings_goal_contributions
  where goal_id = affected_goal_id;

  update savings_goals
  set current_amount = total,
      is_achieved = (total >= target_amount)
  where id = affected_goal_id;

  return null;
end;
$$;

create trigger savings_goal_contributions_refresh
after insert or update or delete on savings_goal_contributions
for each row execute function refresh_savings_goal_total();

-- ---------------------------------------------------------------------------
-- statistics views
-- ---------------------------------------------------------------------------

-- Resolves every transaction into its per-person dollar amount via its shares.
-- Excludes settlements (they're balance-only, not "spending").
create view transaction_person_amounts as
select
  t.id as transaction_id,
  t.household_id,
  t.occurred_on,
  t.category_id,
  t.account_id,
  t.payer_id,
  ts.profile_id,
  ts.ratio * t.amount as person_amount
from transactions t
join transaction_shares ts on ts.transaction_id = t.id
where t.is_settlement = false;

create view monthly_totals as
select
  household_id,
  date_trunc('month', occurred_on)::date as month,
  profile_id,
  sum(person_amount) as total
from transaction_person_amounts
group by household_id, date_trunc('month', occurred_on)::date, profile_id;

-- ---------------------------------------------------------------------------
-- balance ("who owes who") — computed, never stored
-- ---------------------------------------------------------------------------

create or replace function get_household_balance(p_household_id uuid)
returns table (profile_id uuid, net_amount numeric)
language sql
stable
as $$
  -- For every transaction, the payer fronted the full amount. Anyone else's
  -- resolved share of that transaction is money they owe the payer.
  -- net_amount > 0 means this profile is owed money by the household;
  -- net_amount < 0 means this profile owes money.
  with owed_to_payer as (
    select
      t.payer_id as creditor,
      ts.profile_id as debtor,
      ts.ratio * t.amount as amount
    from transactions t
    join transaction_shares ts on ts.transaction_id = t.id
    where t.household_id = p_household_id
      and ts.profile_id <> t.payer_id
  ),
  net as (
    select creditor as profile_id, sum(amount) as delta from owed_to_payer group by creditor
    union all
    select debtor as profile_id, -sum(amount) as delta from owed_to_payer group by debtor
  )
  select profile_id, sum(delta) as net_amount
  from net
  group by profile_id;
$$;
