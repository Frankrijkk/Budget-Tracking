-- Atomically finalizes a scanned receipt: updates the draft receipts row
-- and inserts one transactions row (+ resolved transaction_shares) per line
-- item, all inside a single function call so the transaction_shares
-- sum-to-1.0 deferred trigger only evaluates once everything is written.
--
-- p_items shape: [{ description, amount, category_id, shares: [{profile_id, share_type, ratio}] }, ...]

create or replace function save_receipt_transactions(p_receipt jsonb, p_items jsonb)
returns uuid[]
language plpgsql
as $$
declare
  v_receipt_id uuid := (p_receipt ->> 'id')::uuid;
  v_household_id uuid;
  v_payer_id uuid := (p_receipt ->> 'payer_id')::uuid;
  v_account_id uuid := nullif(p_receipt ->> 'account_id', '')::uuid;
  v_receipt_date date := (p_receipt ->> 'receipt_date')::date;
  v_item jsonb;
  v_transaction_id uuid;
  v_transaction_ids uuid[] := '{}';
begin
  select household_id into v_household_id from receipts where id = v_receipt_id;
  if v_household_id is null then
    raise exception 'receipt % not found', v_receipt_id;
  end if;

  update receipts set
    store_name = p_receipt ->> 'store_name',
    receipt_date = v_receipt_date,
    payer_id = v_payer_id,
    account_id = v_account_id,
    total_amount = (p_receipt ->> 'total_amount')::numeric,
    status = 'confirmed'
  where id = v_receipt_id;

  -- Re-doing a review (e.g. user goes back and edits) should replace the
  -- previously generated line items rather than duplicate them.
  delete from transactions where receipt_id = v_receipt_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into transactions (
      household_id, receipt_id, account_id, category_id, payer_id,
      description, amount, occurred_on, created_by
    )
    values (
      v_household_id,
      v_receipt_id,
      v_account_id,
      nullif(v_item ->> 'category_id', '')::uuid,
      v_payer_id,
      coalesce(v_item ->> 'description', ''),
      (v_item ->> 'amount')::numeric,
      v_receipt_date,
      v_payer_id
    )
    returning id into v_transaction_id;

    insert into transaction_shares (transaction_id, profile_id, share_type, ratio)
    select
      v_transaction_id,
      (share ->> 'profile_id')::uuid,
      share ->> 'share_type',
      (share ->> 'ratio')::numeric
    from jsonb_array_elements(v_item -> 'shares') as share;

    v_transaction_ids := array_append(v_transaction_ids, v_transaction_id);
  end loop;

  return v_transaction_ids;
end;
$$;

revoke all on function save_receipt_transactions(jsonb, jsonb) from public;
grant execute on function save_receipt_transactions(jsonb, jsonb) to authenticated;
