export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          avatar_url: string | null;
          display_name: string | null;
          role: 'user' | 'admin';
          plan: 'free' | 'pro' | 'premium' | 'enterprise';
          preferred_language: 'en' | 'zh';
          interest_tags: string[];
          region_preferences: string[];
          consent_preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          name_en: string | null;
          name_zh: string | null;
          description: string | null;
          description_en: string | null;
          description_zh: string | null;
          website_url: string | null;
          github_url: string | null;
          logo_url: string | null;
          category: string | null;
          subcategory: string | null;
          tags: string[];
          tech_stack: string[];
          pricing_model: 'free' | 'freemium' | 'paid' | 'open_source' | null;
          pricing_url: string | null;
          availability_status: 'active' | 'low_active' | 'inactive' | 'dead';
          commercialization_status: string | null;
          funding_stage: string | null;
          founder_info: string | null;
          launch_date: string | null;
          last_seen: string;
          confidence_score: number;
          confidence_level: 'high' | 'medium' | 'low' | 'unverified';
          validation_signals: Record<string, any>;
          source_count: number;
          weekly_growth_rate: number;
          monthly_growth_rate: number;
          github_stars: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at' | 'confidence_level'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      watchlist: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          added_at: string;
        };
        Insert: Omit<Database['public']['Tables']['watchlist']['Row'], 'id' | 'added_at'>;
        Update: Partial<Database['public']['Tables']['watchlist']['Insert']>;
      };
      push_channels: {
        Row: {
          id: string;
          user_id: string;
          channel_type: string;
          webhook_url: string;
          webhook_secret: string | null;
          push_frequency: 'realtime' | 'daily' | 'weekly';
          push_time: string | null;
          notify_new_products: boolean;
          notify_status_change: boolean;
          notify_test_failure: boolean;
          notify_weekly_report: boolean;
          notify_opportunity_alert: boolean;
          is_active: boolean;
          last_push_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['push_channels']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['push_channels']['Insert']>;
      };
    };
  };
}
