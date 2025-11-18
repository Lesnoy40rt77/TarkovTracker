import { createClient, type User } from "@supabase/supabase-js";
import { reactive } from "vue";

// Define a comprehensive type for our reactive user state
type SupabaseUser = {
  id: string | null;
  loggedIn: boolean;
  email: string | null;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  photoURL: string | null; // Alias for avatarUrl (backward compatibility)
  lastLoginAt: string | null;
  createdAt: string | null;
  provider: string | null; // 'discord', 'twitch', etc.
};

export default defineNuxtPlugin(() => {
  // const config = useRuntimeConfig();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Key missing!");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Reactive user state
  const user = reactive<SupabaseUser>({
    id: null,
    loggedIn: false,
    email: null,
    displayName: null,
    username: null,
    avatarUrl: null,
    photoURL: null,
    lastLoginAt: null,
    createdAt: null,
    provider: null,
  });

  // Helper to update user state
  const updateUserState = (sessionUser: User | null) => {
    if (sessionUser) {
      // Get provider from app_metadata
      const provider = sessionUser.app_metadata?.provider || null;

      user.id = sessionUser.id;
      user.loggedIn = true;
      user.email = sessionUser.email || null;
      user.provider = provider;

      // Extract username based on provider
      if (provider === "discord") {
        // Discord: use full_name (ai.vision) or name without discriminator
        user.username =
          sessionUser.user_metadata?.full_name ||
          sessionUser.user_metadata?.name?.split("#")[0] ||
          sessionUser.user_metadata?.custom_claims?.global_name ||
          sessionUser.email?.split("@")[0] ||
          null;
        user.displayName = user.username;
      } else if (provider === "twitch") {
        // Twitch: use name or preferred_username
        user.username =
          sessionUser.user_metadata?.preferred_username ||
          sessionUser.user_metadata?.name ||
          sessionUser.email?.split("@")[0] ||
          null;
        user.displayName =
          sessionUser.user_metadata?.full_name || user.username;
      } else {
        // Generic fallback
        user.username =
          sessionUser.user_metadata?.name ||
          sessionUser.email?.split("@")[0] ||
          null;
        user.displayName =
          sessionUser.user_metadata?.full_name || user.username;
      }

      // Avatar URL
      const avatarUrl =
        sessionUser.user_metadata?.avatar_url ||
        sessionUser.user_metadata?.picture ||
        null;
      user.avatarUrl = avatarUrl;
      user.photoURL = avatarUrl; // Backward compatibility

      user.lastLoginAt = sessionUser.last_sign_in_at || null;
      user.createdAt = sessionUser.created_at || null;
    } else {
      user.id = null;
      user.loggedIn = false;
      user.email = null;
      user.displayName = null;
      user.username = null;
      user.avatarUrl = null;
      user.photoURL = null;
      user.lastLoginAt = null;
      user.createdAt = null;
      user.provider = null;
    }
  };

  // Initialize auth state
  supabase.auth.getSession().then(({ data: { session } }) => {
    updateUserState(session?.user || null);
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    updateUserState(session?.user || null);

    // Clean up OAuth tokens from URL hash after successful auth
    if (session && window.location.hash.includes("access_token")) {
      // Remove the hash from URL without reloading the page
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  });

  // Auth helpers
  const signInWithOAuth = async (provider: "twitch" | "discord") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    provide: {
      supabase: {
        client: supabase,
        user,
        signInWithOAuth,
        signOut,
      },
    },
  };
});
