import type { ShareType } from '../../types/database.types'

/** A split choice before it's resolved against actual profile ids. */
export interface SplitValue {
  shareType: ShareType
  /** Fraction attributed to the "me" profile when shareType === 'shared'. Her gets 1 - meRatio. */
  meRatio: number
}

export const DEFAULT_SPLIT: SplitValue = { shareType: 'shared', meRatio: 0.5 }

export interface ResolvedShare {
  profile_id: string
  share_type: ShareType
  ratio: number
}

/** Turns a UI split choice into the 1-2 transaction_shares rows that sum to 1.0. */
export function resolveSplit(split: SplitValue, meId: string, herId: string): ResolvedShare[] {
  if (split.shareType === 'me') {
    return [{ profile_id: meId, share_type: 'me', ratio: 1 }]
  }
  if (split.shareType === 'her') {
    return [{ profile_id: herId, share_type: 'her', ratio: 1 }]
  }
  const meRatio = Math.min(Math.max(split.meRatio, 0), 1)
  const shares: ResolvedShare[] = []
  if (meRatio > 0) shares.push({ profile_id: meId, share_type: 'shared', ratio: meRatio })
  if (meRatio < 1) shares.push({ profile_id: herId, share_type: 'shared', ratio: 1 - meRatio })
  return shares
}

/** Inverse of resolveSplit — used to pre-fill the editor when editing an existing transaction. */
export function splitFromShares(
  shares: { profile_id: string; share_type: ShareType; ratio: number }[],
  meId: string,
): SplitValue {
  if (shares.length === 1) {
    const only = shares[0]
    if (only.share_type !== 'shared') return { shareType: only.share_type, meRatio: only.profile_id === meId ? 1 : 0 }
    return { shareType: 'shared', meRatio: only.profile_id === meId ? only.ratio : 1 - only.ratio }
  }
  const mine = shares.find((s) => s.profile_id === meId)
  return { shareType: 'shared', meRatio: mine?.ratio ?? 0.5 }
}
