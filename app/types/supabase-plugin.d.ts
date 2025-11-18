import type { SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseUser {
  id: string | null;
  email: string | null;
  loggedIn: boolean;
  app_metadata?: {
    provider?: string;
    [key: string]: unknown;
  };
  user_metadata?: {
    [key: string]: unknown;
  };
  last_sign_in_at?: string;
  created_at?: string;
  // Legacy Firebase compatibility (optional, can be removed if not used)
  uid?: string;
  displayName?: string | null; // Made optional to align with new properties
  emailVerified?: boolean;
  photoURL?: string | null;
  avatarUrl?: string | null; // Made optional to align with new properties
  lastLoginAt?: string | null; // Made optional to align with new properties
  createdAt?: string | null; // Made optional to align with new properties
}

export interface SupabasePlugin {
  client: SupabaseClient;
  user: SupabaseUser;
  signInWithOAuth: (provider: "twitch" | "discord") => Promise<void>;
  signOut: () => Promise<void>;
}

declare module "#app" {
  interface NuxtApp {
    $supabase: SupabasePlugin;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $supabase: SupabasePlugin;
  }
}
