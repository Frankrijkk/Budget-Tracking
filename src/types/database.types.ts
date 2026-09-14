// Hand-authored to match supabase/migrations/*.sql. Once you have a linked
// Supabase project, regenerate the authoritative version with:
//   npx supabase gen types typescript --linked > src/types/database.types.ts

export type ShareType = 'me' | 'her' | 'shared'
export type AccountType = 'cash' | 'card' | 'savings' | 'other'
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'
export type ReceiptStatus = 'draft' | 'confirmed'

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['households']['Row']>
        Update: Partial<Database['public']['Tables']['households']['Row']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          household_id: string
          display_name: string
          avatar_color: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string
          household_id: string
          display_name: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          household_id: string
          owner_id: string | null
          name: string
          type: AccountType
          icon: string | null
          color: string | null
          is_archived: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['accounts']['Row']> & {
          household_id: string
          name: string
          type: AccountType
        }
        Update: Partial<Database['public']['Tables']['accounts']['Row']>
        Relationships: [
          {
            foreignKeyName: 'accounts_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          id: string
          household_id: string
          name: string
          icon: string
          color: string
          monthly_budget: number | null
          is_archived: boolean
          sort_order: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['categories']['Row']> & {
          household_id: string
          name: string
          icon: string
          color: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Row']>
        Relationships: []
      }
      receipts: {
        Row: {
          id: string
          household_id: string
          store_name: string | null
          receipt_date: string | null
          payer_id: string
          account_id: string | null
          image_path: string | null
          raw_ai_response: unknown
          total_amount: number | null
          status: ReceiptStatus
          created_by: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['receipts']['Row']> & {
          household_id: string
          payer_id: string
          created_by: string
        }
        Update: Partial<Database['public']['Tables']['receipts']['Row']>
        Relationships: [
          {
            foreignKeyName: 'receipts_payer_id_fkey'
            columns: ['payer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'receipts_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          id: string
          household_id: string
          receipt_id: string | null
          account_id: string
          category_id: string | null
          payer_id: string
          description: string
          amount: number
          currency: string
          occurred_on: string
          note: string | null
          recurring_transaction_id: string | null
          is_settlement: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['transactions']['Row']> & {
          household_id: string
          account_id: string
          payer_id: string
          amount: number
          occurred_on: string
          created_by: string
        }
        Update: Partial<Database['public']['Tables']['transactions']['Row']>
        Relationships: [
          {
            foreignKeyName: 'transactions_receipt_id_fkey'
            columns: ['receipt_id']
            isOneToOne: false
            referencedRelation: 'receipts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_payer_id_fkey'
            columns: ['payer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_recurring_transaction_id_fkey'
            columns: ['recurring_transaction_id']
            isOneToOne: false
            referencedRelation: 'recurring_transactions'
            referencedColumns: ['id']
          },
        ]
      }
      transaction_shares: {
        Row: {
          id: string
          transaction_id: string
          profile_id: string
          share_type: ShareType
          ratio: number
        }
        Insert: Partial<Database['public']['Tables']['transaction_shares']['Row']> & {
          transaction_id: string
          profile_id: string
          share_type: ShareType
          ratio: number
        }
        Update: Partial<Database['public']['Tables']['transaction_shares']['Row']>
        Relationships: [
          {
            foreignKeyName: 'transaction_shares_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transaction_shares_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      recurring_transactions: {
        Row: {
          id: string
          household_id: string
          account_id: string
          category_id: string | null
          payer_id: string
          description: string
          amount: number
          frequency: RecurringFrequency
          interval_count: number
          day_of_month: number | null
          weekday: number | null
          start_date: string
          end_date: string | null
          next_run_date: string
          default_share_type: ShareType
          default_ratio: number
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['recurring_transactions']['Row']> & {
          household_id: string
          account_id: string
          payer_id: string
          description: string
          amount: number
          frequency: RecurringFrequency
          start_date: string
          next_run_date: string
        }
        Update: Partial<Database['public']['Tables']['recurring_transactions']['Row']>
        Relationships: [
          {
            foreignKeyName: 'recurring_transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recurring_transactions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recurring_transactions_payer_id_fkey'
            columns: ['payer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      savings_goals: {
        Row: {
          id: string
          household_id: string
          name: string
          icon: string | null
          color: string | null
          target_amount: number
          current_amount: number
          target_date: string | null
          is_achieved: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['savings_goals']['Row']> & {
          household_id: string
          name: string
          target_amount: number
        }
        Update: Partial<Database['public']['Tables']['savings_goals']['Row']>
        Relationships: []
      }
      savings_goal_contributions: {
        Row: {
          id: string
          goal_id: string
          profile_id: string
          amount: number
          occurred_on: string
          note: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['savings_goal_contributions']['Row']> & {
          goal_id: string
          profile_id: string
          amount: number
        }
        Update: Partial<Database['public']['Tables']['savings_goal_contributions']['Row']>
        Relationships: []
      }
    }
    Views: {
      transaction_person_amounts: {
        Row: {
          transaction_id: string
          household_id: string
          occurred_on: string
          category_id: string | null
          account_id: string
          payer_id: string
          profile_id: string
          person_amount: number
        }
        Relationships: []
      }
      monthly_totals: {
        Row: {
          household_id: string
          month: string
          profile_id: string
          total: number
        }
        Relationships: []
      }
    }
    Functions: {
      get_household_balance: {
        Args: { p_household_id: string }
        Returns: { profile_id: string; net_amount: number }[]
      }
      upsert_transaction_with_shares: {
        Args: { p_transaction: Record<string, unknown>; p_shares: Record<string, unknown>[] }
        Returns: string
      }
      save_receipt_transactions: {
        Args: { p_receipt: Record<string, unknown>; p_items: Record<string, unknown>[] }
        Returns: string[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
