-- transaction_shares.ratio must sum to 1.0 per transaction (enforced by a
-- deferred constraint trigger, see 20260914000000_init_schema.sql). Since
-- supabase-js issues separate REST calls as separate implicit transactions,
-- writing a transaction + its shares as independent insert() calls would
-- trip that constraint the moment the first share row lands. This RPC does
-- both writes inside one function call (one implicit transaction), so the
-- deferred check only runs once everything is in place.
--
-- Runs with the caller's own privileges (no SECURITY DEFINER), so the usual
-- household-scoped RLS policies on transactions/transaction_shares still
-- apply -- a caller can only ever write rows into their own household.

create or replace function upsert_transaction_with_shares(p_transaction jsonb, p_shares jsonb)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  if p_transaction ? 'id' then
    v_id := (p_transaction ->> 'id')::uuid;

    update transactions set
      account_id = (p_transaction ->> 'account_id')::uuid,
      category_id = nullif(p_transaction ->> 'category_id', '')::uuid,
      payer_id = (p_transaction ->> 'payer_id')::uuid,
      description = coalesce(p_transaction ->> 'description', ''),
      amount = (p_transaction ->> 'amount')::numeric,
      occurred_on = (p_transaction ->> 'occurred_on')::date,
      note = nullif(p_transaction ->> 'note', ''),
      is_settlement = coalesce((p_transaction ->> 'is_settlement')::boolean, false)
    where id = v_id;

    delete from transaction_shares where transaction_id = v_id;
  else
    insert into transactions (
      household_id, account_id, category_id, payer_id,
      description, amount, occurred_on, note, created_by, is_settlement
    )
    values (
      (p_transaction ->> 'household_id')::uuid,
      (p_transaction ->> 'account_id')::uuid,
      nullif(p_transaction ->> 'category_id', '')::uuid,
      (p_transaction ->> 'payer_id')::uuid,
      coalesce(p_transaction ->> 'description', ''),
      (p_transaction ->> 'amount')::numeric,
      (p_transaction ->> 'occurred_on')::date,
      nullif(p_transaction ->> 'note', ''),
      (p_transaction ->> 'created_by')::uuid,
      coalesce((p_transaction ->> 'is_settlement')::boolean, false)
    )
    returning id into v_id;
  end if;

  insert into transaction_shares (transaction_id, profile_id, share_type, ratio)
  select
    v_id,
    (elem ->> 'profile_id')::uuid,
    elem ->> 'share_type',
    (elem ->> 'ratio')::numeric
  from jsonb_array_elements(p_shares) as elem;

  return v_id;
end;
$$;

revoke all on function upsert_transaction_with_shares(jsonb, jsonb) from public;
grant execute on function upsert_transaction_with_shares(jsonb, jsonb) to authenticated, service_role;

-- Explicit grants for the two functions defined in 20260914000000_init_schema.sql
-- (auth_household_id is SECURITY DEFINER so it can read profiles without
-- recursing into the profiles RLS policy it's used by).
revoke all on function auth_household_id() from public;
grant execute on function auth_household_id() to authenticated;

revoke all on function get_household_balance(uuid) from public;
grant execute on function get_household_balance(uuid) to authenticated;

