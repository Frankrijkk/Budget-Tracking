// Downloads a receipt photo from Storage, sends it to Claude's vision API
// with a forced tool-call schema so the response is always well-formed
// JSON, and stores a draft `receipts` row the client then reviews/edits.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const MODEL = 'claude-haiku-4-5-20251001'

interface ParsedReceipt {
  store: string
  date: string
  items: { name: string; price: number }[]
  total: number
}

const RECORD_RECEIPT_TOOL = {
  name: 'record_receipt',
  description: 'Records the structured contents of a store receipt photo.',
  input_schema: {
    type: 'object',
    properties: {
      store: { type: 'string', description: 'Store/merchant name as printed on the receipt' },
      date: { type: 'string', description: 'Purchase date in ISO 8601 (YYYY-MM-DD). Best guess if unclear.' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            price: { type: 'number' },
          },
          required: ['name', 'price'],
        },
      },
      total: { type: 'number', description: 'The total amount charged, as printed on the receipt' },
    },
    required: ['store', 'date', 'items', 'total'],
  },
}

function isParsedReceipt(value: unknown): value is ParsedReceipt {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.store === 'string' &&
    typeof v.date === 'string' &&
    typeof v.total === 'number' &&
    Array.isArray(v.items) &&
    v.items.every(
      (i) => i && typeof i === 'object' && typeof (i as any).name === 'string' && typeof (i as any).price === 'number',
    )
  )
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401)

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, household_id')
      .eq('id', userData.user.id)
      .single()
    if (profileError || !profile) return json({ error: 'No household profile for this user' }, 403)

    const { storagePath } = await req.json()
    if (!storagePath || typeof storagePath !== 'string') return json({ error: 'storagePath is required' }, 400)
    if (!storagePath.startsWith(`${profile.household_id}/`)) {
      return json({ error: 'storagePath must belong to your household' }, 403)
    }

    const { data: imageBlob, error: downloadError } = await admin.storage.from('receipts').download(storagePath)
    if (downloadError || !imageBlob) return json({ error: 'Could not read uploaded image' }, 400)

    const mediaType = imageBlob.type || 'image/jpeg'
    const base64 = btoa(String.fromCharCode(...new Uint8Array(await imageBlob.arrayBuffer())))

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        tools: [RECORD_RECEIPT_TOOL],
        tool_choice: { type: 'tool', name: 'record_receipt' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              {
                type: 'text',
                text: 'Extract every line item and its price from this store receipt, plus the store name, purchase date, and total. Use the record_receipt tool.',
              },
            ],
          },
        ],
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      return json({ error: `Claude API error: ${errText}` }, 502)
    }

    const aiJson = await aiResponse.json()
    const toolUse = aiJson.content?.find((block: any) => block.type === 'tool_use')
    if (!toolUse || !isParsedReceipt(toolUse.input)) {
      return json({ error: 'Could not extract a valid receipt from that photo. Try a clearer photo or enter it manually.' }, 422)
    }

    const parsed = toolUse.input as ParsedReceipt

    const { data: receipt, error: insertError } = await admin
      .from('receipts')
      .insert({
        household_id: profile.household_id,
        store_name: parsed.store,
        receipt_date: parsed.date,
        payer_id: profile.id,
        image_path: storagePath,
        raw_ai_response: parsed,
        total_amount: parsed.total,
        status: 'draft',
        created_by: profile.id,
      })
      .select()
      .single()

    if (insertError || !receipt) return json({ error: insertError?.message ?? 'Failed to create receipt' }, 500)

    return json({ receipt, parsed })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
