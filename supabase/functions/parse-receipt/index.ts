// Downloads a receipt photo from Storage, sends it to an NVIDIA-hosted
// vision-language model (via the NIM API at integrate.api.nvidia.com,
// OpenAI-compatible chat completions) with a JSON-only prompt, and stores
// a draft `receipts` row the client then reviews/edits.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY')!
// Nemotron Nano VL is purpose-built for document/receipt data extraction
// (line items, totals, dates) -- see
// https://developer.nvidia.com/blog/new-nvidia-llama-nemotron-nano-vision-language-model-tops-ocr-benchmark-for-accuracy/
const MODEL = 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1'

interface ParsedReceipt {
  store: string
  date: string
  items: { name: string; price: number }[]
  total: number
}

const EXTRACTION_PROMPT = `Extract this store receipt into JSON. Respond with ONLY the JSON object, no markdown fences, no other text.

Schema:
{
  "store": string (store/merchant name as printed on the receipt),
  "date": string (purchase date in ISO 8601 YYYY-MM-DD, best guess if unclear),
  "items": [ { "name": string, "price": number } ] (every line item and its price),
  "total": number (the total amount charged, as printed on the receipt)
}`

/** Models occasionally wrap JSON in prose or markdown fences despite instructions -- pull out the object. */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in model response')
  return JSON.parse(candidate.slice(start, end + 1))
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

    const aiResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACTION_PROMPT },
              { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
            ],
          },
        ],
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      return json({ error: `NVIDIA API error: ${errText}` }, 502)
    }

    const aiJson = await aiResponse.json()
    const content = aiJson.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return json({ error: 'No response content from the model' }, 502)
    }

    let candidate: unknown
    try {
      candidate = extractJson(content)
    } catch {
      return json({ error: 'Could not extract a valid receipt from that photo. Try a clearer photo or enter it manually.' }, 422)
    }

    if (!isParsedReceipt(candidate)) {
      return json({ error: 'Could not extract a valid receipt from that photo. Try a clearer photo or enter it manually.' }, 422)
    }

    const parsed = candidate

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
