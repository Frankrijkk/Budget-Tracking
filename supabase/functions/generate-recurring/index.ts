// Invoked daily by pg_cron (see migration 20260914000300_pg_cron_recurring.sql)
// and optionally on-demand from the app's "Run now" button. Finds due
// recurring_transactions, materializes them as real transactions (via the
// same upsert_transaction_with_shares RPC the frontend uses, so the
// transaction_shares sum-to-1.0 constraint is satisfied atomically), and
// advances next_run_date.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CRON_SHARED_SECRET = Deno.env.get('CRON_SHARED_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RecurringRule {
  id: string
  household_id: string
  account_id: string
  category_id: string | null
  payer_id: string
  description: string
  amount: number
  frequency: 'weekly' | 'monthly' | 'yearly'
  interval_count: number
  day_of_month: number | null
  weekday: number | null
  start_date: string
  end_date: string | null
  next_run_date: string
  default_share_type: 'me' | 'her' | 'shared'
  default_ratio: number
}

function resolveShares(rule: RecurringRule, householdProfileIds: [string, string]) {
  const [a, b] = householdProfileIds
  if (rule.default_share_type !== 'shared') {
    const profileId = rule.default_share_type === 'me' ? a : b
    return [{ profile_id: profileId, share_type: rule.default_share_type, ratio: 1 }]
  }
  const ratio = Math.min(Math.max(rule.default_ratio, 0), 1)
  const shares = []
  if (ratio > 0) shares.push({ profile_id: a, share_type: 'shared', ratio })
  if (ratio < 1) shares.push({ profile_id: b, share_type: 'shared', ratio: 1 - ratio })
  return shares
}

function clampDay(year: number, month: number, day: number) {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Math.min(day, lastDay)
}

function advanceDate(rule: RecurringRule): string {
  const current = new Date(rule.next_run_date + 'T00:00:00Z')
  const next = new Date(current)

  if (rule.frequency === 'weekly') {
    next.setUTCDate(next.getUTCDate() + 7 * rule.interval_count)
  } else if (rule.frequency === 'monthly') {
    const targetMonth = next.getUTCMonth() + rule.interval_count
    const day = rule.day_of_month ?? next.getUTCDate()
    next.setUTCFullYear(next.getUTCFullYear(), targetMonth, 1)
    next.setUTCDate(clampDay(next.getUTCFullYear(), next.getUTCMonth(), day))
  } else {
    next.setUTCFullYear(next.getUTCFullYear() + rule.interval_count)
  }

  return next.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  const cronSecret = req.headers.get('x-cron-secret')
  const authHeader = req.headers.get('Authorization')

  const isCron = !!CRON_SHARED_SECRET && cronSecret === CRON_SHARED_SECRET
  let isAuthedUser = false

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  if (!isCron && authHeader) {
    const token = authHeader.replace('Bearer ', '')
    const { data } = await admin.auth.getUser(token)
    isAuthedUser = !!data.user
  }

  if (!isCron && !isAuthedUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const today = new Date().toISOString().slice(0, 10)

  const { data: dueRules, error: fetchError } = await admin
    .from('recurring_transactions')
    .select('*')
    .eq('is_active', true)
    .lte('next_run_date', today)

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  const results: { id: string; created: boolean; error?: string }[] = []

  for (const rule of (dueRules ?? []) as RecurringRule[]) {
    try {
      // Re-check next_run_date hasn't already moved past today (guards
      // against double-firing if this function runs twice concurrently).
      const { data: fresh } = await admin
        .from('recurring_transactions')
        .select('next_run_date, is_active')
        .eq('id', rule.id)
        .single()
      if (!fresh || !fresh.is_active || fresh.next_run_date > today) {
        results.push({ id: rule.id, created: false })
        continue
      }

      const { data: profiles } = await admin
        .from('profiles')
        .select('id')
        .eq('household_id', rule.household_id)
        .order('created_at')
      const profileIds = (profiles ?? []).map((p) => p.id)
      if (profileIds.length !== 2) throw new Error('Expected exactly 2 profiles in household')

      const shares = resolveShares(rule, profileIds as [string, string])

      const { error: rpcError } = await admin.rpc('upsert_transaction_with_shares', {
        p_transaction: {
          household_id: rule.household_id,
          account_id: rule.account_id,
          category_id: rule.category_id,
          payer_id: rule.payer_id,
          description: rule.description,
          amount: rule.amount,
          occurred_on: rule.next_run_date,
          created_by: rule.payer_id,
        },
        p_shares: shares,
      })
      if (rpcError) throw rpcError

      const nextRunDate = advanceDate(rule)
      const isPastEnd = rule.end_date && nextRunDate > rule.end_date

      await admin
        .from('recurring_transactions')
        .update({ next_run_date: nextRunDate, is_active: isPastEnd ? false : true })
        .eq('id', rule.id)

      results.push({ id: rule.id, created: true })
    } catch (e) {
      results.push({ id: rule.id, created: false, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
