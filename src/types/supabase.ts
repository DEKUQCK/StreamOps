export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      event_assets: {
        Row: {
          asset_type: string
          created_at: string
          event_participant_id: number
          id: number
          is_sensitive: boolean
          label: string
          value: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          event_participant_id: number
          id?: never
          is_sensitive?: boolean
          label: string
          value: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          event_participant_id?: number
          id?: never
          is_sensitive?: boolean
          label?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_assets_event_participant_id_fkey"
            columns: ["event_participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participant_checklist_status: {
        Row: {
          checklist_item_id: number
          completed_at: string | null
          event_participant_id: number
          id: number
        }
        Insert: {
          checklist_item_id: number
          completed_at?: string | null
          event_participant_id: number
          id?: never
        }
        Update: {
          checklist_item_id?: number
          completed_at?: string | null
          event_participant_id?: number
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "event_participant_checklist_status_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "sponsor_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participant_checklist_status_event_participant_id_fkey"
            columns: ["event_participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string
          event_id: number
          id: number
          magic_link_token: string
          participant_id: number
          rsvp_status: string
          slot_ends_at: string | null
          slot_starts_at: string | null
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: never
          magic_link_token?: string
          participant_id: number
          rsvp_status?: string
          slot_ends_at?: string | null
          slot_starts_at?: string | null
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: never
          magic_link_token?: string
          participant_id?: number
          rsvp_status?: string
          slot_ends_at?: string | null
          slot_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: number
          name: string
          organization_id: number
          starts_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: never
          name: string
          organization_id: number
          starts_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: never
          name?: string
          organization_id?: number
          starts_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: number
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: number
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: number
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          created_at: string
          discord_user_id: string | null
          display_name: string
          email: string | null
          id: number
          organization_id: number
          portal_token: string
          twitch_username: string | null
        }
        Insert: {
          created_at?: string
          discord_user_id?: string | null
          display_name: string
          email?: string | null
          id?: never
          organization_id: number
          portal_token?: string
          twitch_username?: string | null
        }
        Update: {
          created_at?: string
          discord_user_id?: string | null
          display_name?: string
          email?: string | null
          id?: never
          organization_id?: number
          portal_token?: string
          twitch_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_log: {
        Row: {
          checklist_item_id: number | null
          event_participant_id: number
          id: number
          reminder_type: string
          sent_at: string
        }
        Insert: {
          checklist_item_id?: number | null
          event_participant_id: number
          id?: never
          reminder_type: string
          sent_at?: string
        }
        Update: {
          checklist_item_id?: number | null
          event_participant_id?: number
          id?: never
          reminder_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_log_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "sponsor_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_log_event_participant_id_fkey"
            columns: ["event_participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_checklist_items: {
        Row: {
          created_at: string
          description: string
          due_at: string | null
          event_id: number
          id: number
          sponsor_name: string
        }
        Insert: {
          created_at?: string
          description: string
          due_at?: string | null
          event_id: number
          id?: never
          sponsor_name: string
        }
        Update: {
          created_at?: string
          description?: string
          due_at?: string | null
          event_id?: number
          id?: never
          sponsor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_checklist_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bot_get_pending_reminders: { Args: { p_secret: string }; Returns: Json }
      bot_mark_reminder_sent: {
        Args: {
          p_checklist_item_id?: number
          p_event_participant_id: number
          p_reminder_type: string
          p_secret: string
        }
        Returns: boolean
      }
      complete_checklist_item: {
        Args: { p_checklist_item_id: number; p_token: string }
        Returns: boolean
      }
      create_organization: { Args: { p_name: string }; Returns: number }
      get_participant_calendar: { Args: { p_token: string }; Returns: Json }
      get_participant_portal: { Args: { p_token: string }; Returns: Json }
      set_rsvp_status: {
        Args: { p_status: string; p_token: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
