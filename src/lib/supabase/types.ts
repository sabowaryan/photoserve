/**
 * Supabase Database Types
 * Generated from the existing Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      galleries: {
        Row: {
          created_at: string | null
          expiration_days: number | null
          expires_at: string
          id: string
          is_active: boolean | null
          password_hash: string
          title: string
          unique_slug: string
          updated_at: string | null
          user_id: string | null
          views_count: number | null
          guest_session_id: string | null
          is_unlocked: boolean | null
          payment_type: Database["public"]["Enums"]["payment_type"] | null
          converted_at: string | null
        }
        Insert: {
          created_at?: string | null
          expiration_days?: number | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          password_hash: string
          title: string
          unique_slug: string
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
          guest_session_id?: string | null
          is_unlocked?: boolean | null
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          converted_at?: string | null
        }
        Update: {
          created_at?: string | null
          expiration_days?: number | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          password_hash?: string
          title?: string
          unique_slug?: string
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
          guest_session_id?: string | null
          is_unlocked?: boolean | null
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          converted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "galleries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          cloudinary_public_id: string | null
          cloudinary_url: string
          created_at: string | null
          file_size_mb: number | null
          gallery_id: string
          id: string
          order_index: number | null
        }
        Insert: {
          cloudinary_public_id?: string | null
          cloudinary_url: string
          created_at?: string | null
          file_size_mb?: number | null
          gallery_id: string
          id?: string
          order_index?: number | null
        }
        Update: {
          cloudinary_public_id?: string | null
          cloudinary_url?: string
          created_at?: string | null
          file_size_mb?: number | null
          gallery_id?: string
          id?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "images_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          is_suspended: boolean | null
          max_galleries: number | null
          max_image_size_mb: number | null
          max_images_per_gallery: number | null
          name: string | null
          storage_limit_mb: number | null
          storage_used_mb: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"] | null
          updated_at: string | null
          onboarding_completed: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          max_galleries?: number | null
          max_image_size_mb?: number | null
          max_images_per_gallery?: number | null
          name?: string | null
          storage_limit_mb?: number | null
          storage_used_mb?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          updated_at?: string | null
          onboarding_completed?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          max_galleries?: number | null
          max_image_size_mb?: number | null
          max_images_per_gallery?: number | null
          name?: string | null
          storage_limit_mb?: number | null
          storage_used_mb?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          updated_at?: string | null
          onboarding_completed?: boolean | null
        }
        Relationships: []
      }
      gallery_payments: {
        Row: {
          id: string
          gallery_id: string
          stripe_payment_intent_id: string
          amount_cents: number
          currency: string | null
          status: Database["public"]["Enums"]["payment_status"]
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          gallery_id: string
          stripe_payment_intent_id: string
          amount_cents: number
          currency?: string | null
          status: Database["public"]["Enums"]["payment_status"]
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          gallery_id?: string
          stripe_payment_intent_id?: string
          amount_cents?: number
          currency?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_payments_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          admin_id: string
          action_type: Database["public"]["Enums"]["audit_action_type"]
          entity_type: Database["public"]["Enums"]["audit_entity_type"]
          entity_id: string | null
          details: Record<string, unknown>
          ip_address: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          admin_id: string
          action_type: Database["public"]["Enums"]["audit_action_type"]
          entity_type: Database["public"]["Enums"]["audit_entity_type"]
          entity_id?: string | null
          details?: Record<string, unknown>
          ip_address?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          admin_id?: string
          action_type?: Database["public"]["Enums"]["audit_action_type"]
          entity_type?: Database["public"]["Enums"]["audit_entity_type"]
          entity_id?: string | null
          details?: Record<string, unknown>
          ip_address?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      rate_limit_attempts: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          first_attempt_at: string
          id: string
          key: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          first_attempt_at?: string
          id?: string
          key: string
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          first_attempt_at?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          custom_expiration: boolean | null
          id: string
          max_expiration_days: number
          max_galleries: number
          max_image_size_mb: number
          max_images_per_gallery: number
          name: Database["public"]["Enums"]["subscription_plan"]
          price_monthly: number
          price_yearly: number
          storage_limit_mb: number
        }
        Insert: {
          created_at?: string | null
          custom_expiration?: boolean | null
          id?: string
          max_expiration_days: number
          max_galleries: number
          max_image_size_mb: number
          max_images_per_gallery: number
          name: Database["public"]["Enums"]["subscription_plan"]
          price_monthly: number
          price_yearly: number
          storage_limit_mb: number
        }
        Update: {
          created_at?: string | null
          custom_expiration?: boolean | null
          id?: string
          max_expiration_days?: number
          max_galleries?: number
          max_image_size_mb?: number
          max_images_per_gallery?: number
          name?: Database["public"]["Enums"]["subscription_plan"]
          price_monthly?: number
          price_yearly?: number
          storage_limit_mb?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          id: string
          gallery_id: string
          image_id: string
          session_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          gallery_id: string
          image_id: string
          session_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          gallery_id?: string
          image_id?: string
          session_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          image_id: string
          session_id: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          image_id: string
          session_id: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          image_id?: string
          session_id?: string
          content?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          }
        ]
      }
      gallery_analytics: {
        Row: {
          id: string
          gallery_id: string
          visitor_ip: string | null
          country_code: string | null
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          gallery_id: string
          visitor_ip?: string | null
          country_code?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          gallery_id?: string
          visitor_ip?: string | null
          country_code?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_analytics_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_captures: {
        Row: {
          id: string
          gallery_id: string
          email: string
          captured_at: string | null
        }
        Insert: {
          id?: string
          gallery_id: string
          email: string
          captured_at?: string | null
        }
        Update: {
          id?: string
          gallery_id?: string
          email?: string
          captured_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_captures_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          }
        ]
      }
      testimonials: {
        Row: {
          id: string
          gallery_id: string
          rating: number
          comment: string | null
          author_name: string | null
          is_public: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          gallery_id: string
          rating: number
          comment?: string | null
          author_name?: string | null
          is_public?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          gallery_id?: string
          rating?: number
          comment?: string | null
          author_name?: string | null
          is_public?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string | null
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string | null
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      galleries_public: {
        Row: {
          created_at: string | null
          expiration_days: number | null
          expires_at: string | null
          id: string | null
          is_active: boolean | null
          title: string | null
          unique_slug: string | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          created_at?: string | null
          expiration_days?: number | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          title?: string | null
          unique_slug?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          created_at?: string | null
          expiration_days?: number | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          title?: string | null
          unique_slug?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_rate_limits: { Args: Record<string, never>; Returns: number }
      decrement_storage: {
        Args: { size_mb: number; user_id: string }
        Returns: undefined
      }
      generate_unique_slug: { Args: Record<string, never>; Returns: string }
      increment_storage: {
        Args: { size_mb: number; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      subscription_plan: "free" | "premium" | "pro"
      audit_action_type: "user_view" | "user_update" | "user_suspend" | "user_reactivate" | "gallery_view" | "gallery_deactivate" | "gallery_delete" | "subscription_update" | "subscription_cancel" | "admin_login"
      audit_entity_type: "user" | "gallery" | "subscription" | "system"
      payment_type: "free" | "one_time" | "subscription"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Convenience type aliases
export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type Gallery = Tables<'galleries'>
export type GalleryInsert = TablesInsert<'galleries'>
export type GalleryUpdate = TablesUpdate<'galleries'>

export type Image = Tables<'images'>
export type ImageInsert = TablesInsert<'images'>
export type ImageUpdate = TablesUpdate<'images'>

export type RateLimitAttempt = Tables<'rate_limit_attempts'>
export type RateLimitAttemptInsert = TablesInsert<'rate_limit_attempts'>
export type RateLimitAttemptUpdate = TablesUpdate<'rate_limit_attempts'>

export type SubscriptionPlanRow = Tables<'subscription_plans'>
export type SubscriptionPlan = Enums<'subscription_plan'>

// Audit Log types
export type AuditLog = Tables<'audit_logs'>
export type AuditLogInsert = TablesInsert<'audit_logs'>
export type AuditLogUpdate = TablesUpdate<'audit_logs'>
export type AuditActionType = Enums<'audit_action_type'>
export type AuditEntityType = Enums<'audit_entity_type'>

// Gallery Payment types
export type GalleryPayment = Tables<'gallery_payments'>
export type GalleryPaymentInsert = TablesInsert<'gallery_payments'>
export type GalleryPaymentUpdate = TablesUpdate<'gallery_payments'>
export type PaymentType = Enums<'payment_type'>
export type PaymentStatus = Enums<'payment_status'>

// Favorites types
export type Favorite = Tables<'favorites'>
export type FavoriteInsert = TablesInsert<'favorites'>
export type FavoriteUpdate = TablesUpdate<'favorites'>

// Comments types
export type Comment = Tables<'comments'>
export type CommentInsert = TablesInsert<'comments'>
export type CommentUpdate = TablesUpdate<'comments'>

// Gallery Analytics types
export type GalleryAnalytics = Tables<'gallery_analytics'>
export type GalleryAnalyticsInsert = TablesInsert<'gallery_analytics'>
export type GalleryAnalyticsUpdate = TablesUpdate<'gallery_analytics'>

// Lead Captures types
export type LeadCapture = Tables<'lead_captures'>
export type LeadCaptureInsert = TablesInsert<'lead_captures'>
export type LeadCaptureUpdate = TablesUpdate<'lead_captures'>

// Testimonials types
export type Testimonial = Tables<'testimonials'>
export type TestimonialInsert = TablesInsert<'testimonials'>
export type TestimonialUpdate = TablesUpdate<'testimonials'>

// Admin Settings types
export type AdminSetting = Tables<'admin_settings'>
export type AdminSettingInsert = TablesInsert<'admin_settings'>
export type AdminSettingUpdate = TablesUpdate<'admin_settings'>
