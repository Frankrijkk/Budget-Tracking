-- Local dev seed: a household + starter categories + accounts.
-- The two auth.users/profiles rows are NOT created here — see README.md
-- "Provisioning the two accounts" for that one-time manual step, since it
-- needs real emails/passwords and differs between local dev and hosted.

insert into households (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Our Household')
on conflict (id) do nothing;

insert into accounts (id, household_id, name, type, icon)
values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Shared Card', 'card', '💳')
on conflict (id) do nothing;

insert into categories (household_id, name, icon, color, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', 'Groceries', 'shopping-cart', '#5fe0c4', 1),
  ('00000000-0000-0000-0000-000000000001', 'Dining Out', 'utensils', '#ff8a7a', 2),
  ('00000000-0000-0000-0000-000000000001', 'Transport', 'car', '#6fb8ff', 3),
  ('00000000-0000-0000-0000-000000000001', 'Rent', 'home', '#b8a1ff', 4),
  ('00000000-0000-0000-0000-000000000001', 'Utilities', 'zap', '#f5c563', 5),
  ('00000000-0000-0000-0000-000000000001', 'Shopping', 'shopping-bag', '#f78fc2', 6),
  ('00000000-0000-0000-0000-000000000001', 'Entertainment', 'film', '#a8d88a', 7),
  ('00000000-0000-0000-0000-000000000001', 'Health', 'pill', '#ff8a7a', 8),
  ('00000000-0000-0000-0000-000000000001', 'Other', 'package', '#9891a3', 9)
on conflict (household_id, name) do nothing;
