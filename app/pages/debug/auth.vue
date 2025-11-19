<template>
  <v-container>
    <v-card>
      <v-card-title>Firebase Auth Debug Page</v-card-title>
      <v-card-subtitle>Testing Firebase Authentication</v-card-subtitle>
      <v-card-text>
        <v-alert v-if="!user.loggedIn" type="warning" class="mb-4">
          You are not logged in
        </v-alert>
        <v-alert v-if="user.loggedIn" type="success" class="mb-4">
          Successfully authenticated!
        </v-alert>
        <div class="auth-info mb-4">
          <h3 class="mb-3">Auth State:</h3>
          <v-simple-table dense>
            <tbody>
              <tr>
                <td><strong>Logged In:</strong></td>
                <td>{{ user.loggedIn }}</td>
              </tr>
              <tr>
                <td><strong>ID:</strong></td>
                <td>{{ user.id || "N/A" }}</td>
              </tr>
              <tr>
                <td><strong>Email:</strong></td>
                <td>{{ user.email || "N/A" }}</td>
              </tr>
              <tr>
                <td><strong>Provider:</strong></td>
                <td>{{ user.app_metadata?.provider || "N/A" }}</td>
              </tr>
              <tr>
                <td><strong>Last Sign In:</strong></td>
                <td>{{ user.last_sign_in_at || "N/A" }}</td>
              </tr>
              <tr>
                <td><strong>Created At:</strong></td>
                <td>{{ user.created_at || "N/A" }}</td>
              </tr>
            </tbody>
          </v-simple-table>
        </div>
        <v-divider class="my-4" />
        <h3 class="mb-3">User Store State:</h3>
        <div class="store-info mb-4">
          <v-simple-table dense>
            <tbody>
              <tr>
                <td><strong>ID from Store:</strong></td>
                <td>{{ user.id || "N/A" }}</td>
              </tr>
              <tr>
                <td><strong>Store Initialized:</strong></td>
                <td>{{ userStore ? "Yes" : "No" }}</td>
              </tr>
            </tbody>
          </v-simple-table>
        </div>
        <v-divider class="my-4" />
        <div class="actions">
          <AuthButtons v-if="!user.loggedIn" />
          <v-btn
            v-if="user.loggedIn"
            color="error"
            class="mt-2"
            @click="handleLogout"
          >
            Logout
          </v-btn>
        </div>
        <v-divider class="my-4" />
        <h3 class="mb-3">Raw User Object:</h3>
        <pre class="debug-json">{{ JSON.stringify(user, null, 2) }}</pre>
      </v-card-text>
    </v-card>
  </v-container>
</template>
<script setup lang="ts">
import { useUserStore } from "@/stores/user";
const { $supabase } = useNuxtApp();
const user = $supabase.user;
const userStore = useUserStore();
const handleLogout = async () => {
  try {
    await $supabase.signOut();
  } catch (error) {
    console.error("Logout error:", error);
  }
};
</script>
<style scoped>
.auth-info,
.store-info {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}
.debug-json {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-size: 12px;
}
</style>
