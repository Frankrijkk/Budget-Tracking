import { useRef, useState } from 'react'
import { ChevronLeft, Camera, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUploadReceipt } from './useReceipts'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

export function ReceiptCapturePage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadReceipt = useUploadReceipt()
  const online = useNetworkStatus()
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setPreview(URL.createObjectURL(file))
    try {
      const result = await uploadReceipt.mutateAsync(file)
      navigate(`/receipts/${result.receipt.id}/review`, { state: { parsed: result.parsed } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process receipt')
    }
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted">
        <ChevronLeft size={20} /> Back
      </button>

      <h1 className="text-lg font-semibold text-text">Scan Receipt</h1>

      {!online && (
        <p className="rounded-xl border border-border bg-surface p-3 text-sm text-text-muted">
          You're offline — receipt scanning needs an internet connection. Enter this one manually instead, or try again once you're back online.
        </p>
      )}

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-surface p-8">
        {preview ? (
          <img src={preview} alt="Receipt preview" className="max-h-64 rounded-lg object-contain" />
        ) : (
          <Camera size={40} className="text-text-muted" />
        )}

        {uploadReceipt.isPending ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 size={16} className="animate-spin" /> Reading receipt…
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={!online}
            className="rounded-xl bg-accent px-5 py-2.5 font-medium text-bg disabled:opacity-40"
          >
            {preview ? 'Retake photo' : 'Take photo'}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
