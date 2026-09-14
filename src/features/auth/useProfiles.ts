import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useSession } from './useSession'
import type { Database } from '../../types/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

interface Profiles {
  me: Profile | undefined
  partner: Profile | undefined
  all: Profile[]
}

export function useProfiles() {
  const { session } = useSession()
  const userId = session?.user.id

  return useQuery<Profiles>({
    queryKey: ['profiles', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at')
      if (error) throw error
      const all = data ?? []
      return {
        me: all.find((p) => p.id === userId),
        partner: all.find((p) => p.id !== userId),
        all,
      }
    },
  })
}
