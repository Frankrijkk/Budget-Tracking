-- Local dev seed: a household + starter categories + accounts.
-- The two auth.users/profiles rows are NOT created here — see README.md
-- "Provisioning the two accounts" for that one-time manual step, since it
-- needs real emails/passwords and differs between local dev and hosted.

insert into households (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Our Household')
on conflict (id) do nothing;

insert into categories (household_id, name, icon, color, monthly_budget, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', 'Groceries', '🛒', '#4fd1a5', 500, 1),
  ('00000000-0000-0000-0000-000000000001', 'Dining Out', '🍔', '#ffb454', 200, 2),
  ('00000000-0000-0000-0000-000000000001', 'Transport', '🚗', '#5b9bff', 150, 3),
  ('00000000-0000-0000-0000-000000000001', 'Rent', '🏠', '#ff7ab8', 1200, 4),
  ('00000000-0000-0000-0000-000000000001', 'Utilities', '💡', '#f6c945', 150, 5),
  ('00000000-0000-0000-0000-000000000001', 'Shopping', '🛍️', '#c792ea', 200, 6),
  ('00000000-0000-0000-0000-000000000001', 'Entertainment', '🎬', '#7fdbff', 100, 7),
  ('00000000-0000-0000-0000-000000000001', 'Health', '💊', '#ff6b6b', 100, 8),
  ('00000000-0000-0000-0000-000000000001', 'Other', '📦', '#93a1b0', null, 9)
on conflict (household_id, name) do nothing;
