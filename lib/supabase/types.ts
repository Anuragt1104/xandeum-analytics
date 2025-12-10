// Supabase Database Types
// These types match your Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pnodes: {
        Row: {
          id: string;
          identity_pubkey: string;
          display_name: string | null;
          current_ip: string;
          port: number;
          software_version: string;
          geo_country: string | null;
          geo_country_code: string | null;
          geo_city: string | null;
          geo_latitude: number | null;
          geo_longitude: number | null;
          geo_isp: string | null;
          status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
          first_seen: string;
          last_seen: string;
          is_latest_version: boolean;
          is_incentivized: boolean;
          has_nft_multiplier: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          identity_pubkey: string;
          display_name?: string | null;
          current_ip: string;
          port?: number;
          software_version: string;
          geo_country?: string | null;
          geo_country_code?: string | null;
          geo_city?: string | null;
          geo_latitude?: number | null;
          geo_longitude?: number | null;
          geo_isp?: string | null;
          status?: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
          first_seen?: string;
          last_seen?: string;
          is_latest_version?: boolean;
          is_incentivized?: boolean;
          has_nft_multiplier?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          identity_pubkey?: string;
          display_name?: string | null;
          current_ip?: string;
          port?: number;
          software_version?: string;
          geo_country?: string | null;
          geo_country_code?: string | null;
          geo_city?: string | null;
          geo_latitude?: number | null;
          geo_longitude?: number | null;
          geo_isp?: string | null;
          status?: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
          first_seen?: string;
          last_seen?: string;
          is_latest_version?: boolean;
          is_incentivized?: boolean;
          has_nft_multiplier?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      node_metrics: {
        Row: {
          id: string;
          node_id: string;
          timestamp: string;
          uptime_seconds: number;
          uptime_percent: number;
          rpc_latency_ms: number;
          peer_count: number;
          storage_used_bytes: number;
          storage_capacity_bytes: number;
          storage_percent: number;
          sri: number;
          rpc_availability: number;
          gossip_visibility: number;
          version_compliance: number;
          status_code: number;
          sentinel_id: string | null;
        };
        Insert: {
          id?: string;
          node_id: string;
          timestamp?: string;
          uptime_seconds: number;
          uptime_percent: number;
          rpc_latency_ms: number;
          peer_count: number;
          storage_used_bytes: number;
          storage_capacity_bytes: number;
          storage_percent: number;
          sri: number;
          rpc_availability: number;
          gossip_visibility: number;
          version_compliance: number;
          status_code?: number;
          sentinel_id?: string | null;
        };
        Update: {
          id?: string;
          node_id?: string;
          timestamp?: string;
          uptime_seconds?: number;
          uptime_percent?: number;
          rpc_latency_ms?: number;
          peer_count?: number;
          storage_used_bytes?: number;
          storage_capacity_bytes?: number;
          storage_percent?: number;
          sri?: number;
          rpc_availability?: number;
          gossip_visibility?: number;
          version_compliance?: number;
          status_code?: number;
          sentinel_id?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          role: 'USER' | 'OPERATOR' | 'ADMIN';
          wallet_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'USER' | 'OPERATOR' | 'ADMIN';
          wallet_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'USER' | 'OPERATOR' | 'ADMIN';
          wallet_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      claimed_nodes: {
        Row: {
          id: string;
          user_id: string;
          node_id: string;
          claimed_at: string;
          verified: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          node_id: string;
          claimed_at?: string;
          verified?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          node_id?: string;
          claimed_at?: string;
          verified?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      node_status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
      user_role: 'USER' | 'OPERATOR' | 'ADMIN';
    };
  };
}

// Helper types
export type PNodeRow = Database['public']['Tables']['pnodes']['Row'];
export type NodeMetricRow = Database['public']['Tables']['node_metrics']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ClaimedNodeRow = Database['public']['Tables']['claimed_nodes']['Row'];

