-- Row Level Security: every row is scoped to the caller's household.
-- Exactly two auth.users rows will ever exist for this app, provisioned
-- manually (see README) — there is no public signup path.

alter table households enable row level security;
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table receipts enable row level security;
alter table transactions enable row level security;
alter table transaction_shares enable row level security;
alter table recurring_transactions enable row level security;
alter table savings_goals enable row level security;
alter table savings_goal_contributions enable row level security;

-- Small helper: the caller's household_id (or null if not a household member).
create or replace function auth_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- households: read-only from the client, provisioned via migration/dashboard
-- ---------------------------------------------------------------------------

create policy "household members can select household"
on households for select
using (id = auth_household_id());

-- ---------------------------------------------------------------------------
-- profiles: household members can see each other, only edit their own row
-- ---------------------------------------------------------------------------

create policy "household members can select profiles"
on profiles for select
using (household_id = auth_household_id());

create policy "users can update their own profile"
on profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- generic household-scoped CRUD policy, applied per table below
-- ---------------------------------------------------------------------------

create policy "household members can select accounts"
on accounts for select using (household_id = auth_household_id());
create policy "household members can insert accounts"
on accounts for insert with check (household_id = auth_household_id());
create policy "household members can update accounts"
on accounts for update using (household_id = auth_household_id());
create policy "household members can delete accounts"
on accounts for delete using (household_id = auth_household_id());

create policy "household members can select categories"
on categories for select using (household_id = auth_household_id());
create policy "household members can insert categories"
on categories for insert with check (household_id = auth_household_id());
create policy "household members can update categories"
on categories for update using (household_id = auth_household_id());
create policy "household members can delete categories"
on categories for delete using (household_id = auth_household_id());

create policy "household members can select receipts"
on receipts for select using (household_id = auth_household_id());
create policy "household members can insert receipts"
on receipts for insert with check (household_id = auth_household_id());
create policy "household members can update receipts"
on receipts for update using (household_id = auth_household_id());
create policy "household members can delete receipts"
on receipts for delete using (household_id = auth_household_id());

create policy "household members can select transactions"
on transactions for select using (household_id = auth_household_id());
create policy "household members can insert transactions"
on transactions for insert with check (household_id = auth_household_id());
create policy "household members can update transactions"
on transactions for update using (household_id = auth_household_id());
create policy "household members can delete transactions"
on transactions for delete using (household_id = auth_household_id());

create policy "household members can select recurring_transactions"
on recurring_transactions for select using (household_id = auth_household_id());
create policy "household members can insert recurring_transactions"
on recurring_transactions for insert with check (household_id = auth_household_id());
create policy "household members can update recurring_transactions"
on recurring_transactions for update using (household_id = auth_household_id());
create policy "household members can delete recurring_transactions"
on recurring_transactions for delete using (household_id = auth_household_id());

create policy "household members can select savings_goals"
on savings_goals for select using (household_id = auth_household_id());
create policy "household members can insert savings_goals"
on savings_goals for insert with check (household_id = auth_household_id());
create policy "household members can update savings_goals"
on savings_goals for update using (household_id = auth_household_id());
create policy "household members can delete savings_goals"
on savings_goals for delete using (household_id = auth_household_id());

-- ---------------------------------------------------------------------------
-- transaction_shares: no household_id column, join through transactions
-- ---------------------------------------------------------------------------

create policy "household members can select transaction_shares"
on transaction_shares for select using (
  exists (
    select 1 from transactions t
    where t.id = transaction_shares.transaction_id
      and t.household_id = auth_household_id()
  )
);
create policy "household members can insert transaction_shares"
on transaction_shares for insert with check (
  exists (
    select 1 from transactions t
    where t.id = transaction_shares.transaction_id
      and t.household_id = auth_household_id()
  )
);
create policy "household members can update transaction_shares"
on transaction_shares for update using (
  exists (
    select 1 from transactions t
    where t.id = transaction_shares.transaction_id
      and t.household_id = auth_household_id()
  )
);
create policy "household members can delete transaction_shares"
on transaction_shares for delete using (
  exists (
    select 1 from transactions t
    where t.id = transaction_shares.transaction_id
      and t.household_id = auth_household_id()
  )
);

-- ---------------------------------------------------------------------------
-- savings_goal_contributions: no household_id column, join through goals
-- ---------------------------------------------------------------------------

create policy "household members can select savings_goal_contributions"
on savings_goal_contributions for select using (
  exists (
    select 1 from savings_goals g
    where g.id = savings_goal_contributions.goal_id
      and g.household_id = auth_household_id()
  )
);
create policy "household members can insert savings_goal_contributions"
on savings_goal_contributions for insert with check (
  exists (
    select 1 from savings_goals g
    where g.id = savings_goal_contributions.goal_id
      and g.household_id = auth_household_id()
  )
);
create policy "household members can delete savings_goal_contributions"
on savings_goal_contributions for delete using (
  exists (
    select 1 from savings_goals g
    where g.id = savings_goal_contributions.goal_id
      and g.household_id = auth_household_id()
  )
);

-- ---------------------------------------------------------------------------
-- storage: private "receipts" bucket, scoped by household_id path prefix
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "household members can read their receipt images"
on storage.objects for select
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth_household_id()::text
);

create policy "household members can upload their receipt images"
on storage.objects for insert
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth_household_id()::text
);

create policy "household members can delete their receipt images"
on storage.objects for delete
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth_household_id()::text
);
