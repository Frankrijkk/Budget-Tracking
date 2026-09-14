import { LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useProfiles } from '../auth/useProfiles'

export function SettingsPage() {
  const { data: profiles } = useProfiles()

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-text">Settings</h1>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-muted">Signed in as</p>
        <p className="mt-1 font-medium text-text">{profiles?.me?.display_name}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">
        <p className="mb-2 font-medium text-text">Add a Quick Add shortcut (iPhone)</p>
        <p>
          Open this app in Safari, navigate to the <code className="rounded bg-bg px-1">/quick-add</code> page,
          tap Share → Add to Home Screen, and name it "Quick Add". This creates a second home screen icon
          that jumps straight to fast expense entry.
        </p>
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 font-medium text-danger active:bg-surface"
      >
        <LogOut size={18} /> Sign out
      </button>
    </div>
  )
}
