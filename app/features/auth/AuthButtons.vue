<template>
  <div>
    <v-container>
      <v-row justify="center">
        <v-col cols="12" sm="10" md="8" lg="6" xl="4">
          <v-card class="auth-card elevation-8" color="rgb(18, 25, 30)">
            <div class="auth-header">
              <v-avatar size="72" class="mt-8 mb-3">
                <v-icon size="48" color="grey">mdi-shield-account</v-icon>
              </v-avatar>
              <h2 class="text-h5 font-weight-bold mb-2">
                Sign in to access your account
              </h2>
              <p class="text-body-2 text-medium-emphasis mb-6">
                Track your progress, share with friends, and coordinate raids
              </p>
            </div>
            <v-card-text class="px-6 pb-6 pt-2">
              <v-btn
                block
                variant="elevated"
                class="mb-4 auth-btn twitch-btn"
                color="#9146FF"
                height="50"
                :loading="loading.twitch"
                :disabled="loading.twitch || loading.discord"
                @click="signInWithTwitch"
              >
                <div class="d-flex align-center justify-center w-100">
                  <v-icon start color="white" class="mr-3">mdi-twitch</v-icon>
                  <span class="text-white">Continue with Twitch</span>
                </div>
              </v-btn>
              <v-btn
                block
                class="auth-btn discord-btn"
                color="#5865F2"
                height="50"
                :loading="loading.discord"
                :disabled="loading.twitch || loading.discord"
                @click="signInWithDiscord"
              >
                <div class="d-flex align-center justify-center w-100">
                  <v-icon start color="white" class="mr-3"
                    >mdi-controller</v-icon
                  >
                  <span class="text-white">Continue with Discord</span>
                </div>
              </v-btn>
            </v-card-text>
            <div class="auth-footer px-6 py-3">
              <div class="d-flex justify-space-between">
                <v-btn
                  variant="text"
                  color="grey-lighten-1"
                  class="text-caption text-lowercase"
                  href="/privacy"
                  target="_blank"
                >
                  Privacy Policy
                </v-btn>
                <v-btn
                  variant="text"
                  color="grey-lighten-1"
                  class="text-caption text-lowercase"
                  href="/terms"
                  target="_blank"
                >
                  Terms of Service
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script setup>
import { ref, onMounted, nextTick } from "vue";
import DataMigrationService from "@/utils/DataMigrationService";

const { $supabase } = useNuxtApp();
const loading = ref({
  google: false, // Kept for compatibility if needed, but we'll use Twitch/Discord
  github: false,
  twitch: false,
  discord: false,
});
const hasLocalData = ref(false);

// Prevent automatic navigation after login - we'll handle it manually
onMounted(async () => {
  try {
    // Wait for Vue to finish initial rendering and give Pinia time to initialize
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Check for local data
    hasLocalData.value = DataMigrationService.hasLocalData();
  } catch (error) {
    console.error("Error in onMounted:", error);
  }
});

const signInWithTwitch = async () => {
  try {
    loading.value.twitch = true;
    await $supabase.signInWithOAuth("twitch");
  } catch (error) {
    console.error("Twitch sign in error:", error);
    loading.value.twitch = false;
  }
};

const signInWithDiscord = async () => {
  try {
    loading.value.discord = true;
    await $supabase.signInWithOAuth("discord");
  } catch (error) {
    console.error("Discord sign in error:", error);
    loading.value.discord = false;
  }
};
</script>
<style scoped>
.auth-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgb(18, 25, 30);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}
.auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 24px;
}
.auth-btn {
  letter-spacing: 0.5px;
  text-transform: none;
  font-weight: 500;
  border-radius: 4px;
}
.github-btn {
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.github-btn:hover {
  background-color: #2c3136 !important;
}
.google-btn {
  border: 1px solid rgba(0, 0, 0, 0.1);
}
.google-btn:hover {
  background-color: #f5f5f5 !important;
}
.auth-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(0, 0, 0, 0.2);
}
</style>
