-- Budgets move out of categories.monthly_budget into their own table, so a
-- category can have an optional shared (household-wide) budget AND an
-- optional personal budget per person, all independently addable.

create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  category_id uuid not null references categories (id) on delete cascade,
  profile_id uuid references profiles (id) on delete cascade, -- null = shared/household budget
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index budgets_household_id_idx on budgets (household_id);
create index budgets_category_id_idx on budgets (category_id);

-- At most one shared budget per category...
create unique index budgets_shared_unique_idx on budgets (category_id) where profile_id is null;
-- ...and at most one personal budget per (category, person).
create unique index budgets_personal_unique_idx on budgets (category_id, profile_id) where profile_id is not null;

alter table budgets enable row level security;

create policy "household members can select budgets"
on budgets for select using (household_id = auth_household_id());
create policy "household members can insert budgets"
on budgets for insert with check (household_id = auth_household_id());
create policy "household members can update budgets"
on budgets for update using (household_id = auth_household_id());
create policy "household members can delete budgets"
on budgets for delete using (household_id = auth_household_id());

-- Carry over any existing per-category budgets as shared budgets.
insert into budgets (household_id, category_id, profile_id, amount)
select household_id, id, null, monthly_budget
from categories
where monthly_budget is not null;

alter table categories drop column monthly_budget;
