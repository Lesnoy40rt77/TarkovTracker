<template>
  <v-list nav bg-color="transparent" class="mx-auto">
    <template v-if="isLoggedIn">
      <v-list-group value="user-account-menu">
        <template #activator="{ props: activatorProps }">
          <template v-if="isCollapsed">
            <v-avatar
              v-bind="activatorProps"
              class="mx-auto"
              size="32"
              :class="'d-flex fake-link'"
            >
              <v-img :src="avatarSrc" />
            </v-avatar>
          </template>
          <template v-else>
            <v-list-item
              v-bind="activatorProps"
              :title="userDisplayName"
              :prepend-avatar="avatarSrc"
            ></v-list-item>
          </template>
        </template>
        <DrawerItem
          icon="mdi-lock"
          locale-key="logout"
          :is-collapsed="isCollapsed"
          @click.stop="logout"
        />
      </v-list-group>
    </template>
    <template v-else>
      <DrawerItem
        icon="mdi-fingerprint"
        locale-key="login"
        to="/login"
        :is-collapsed="isCollapsed"
      />
    </template>
  </v-list>
</template>
<script setup>
import { defineAsyncComponent, computed } from "vue";
import { useUserStore } from "@/stores/user";
defineProps({
  isCollapsed: {
    type: Boolean,
    required: true,
  },
});
const { $supabase } = useNuxtApp();
const userStore = useUserStore();
const DrawerItem = defineAsyncComponent(
  () => import("@/features/drawer/DrawerItem.vue")
);
const isLoggedIn = computed(() => $supabase.user?.loggedIn ?? false);
const avatarSrc = computed(() => {
  return userStore.getStreamerMode || !$supabase.user.photoURL
    ? "/img/default-avatar.svg"
    : $supabase.user.photoURL;
});
const userDisplayName = computed(() => {
  return userStore.getStreamerMode
    ? "User"
    : $supabase.user.displayName || "User";
});
function logout() {
  $supabase.signOut();
}
</script>
<style lang="scss" scoped>
:global(
  body
    > div.v-overlay-container
    > div.allow-overflow
    > div.v-overlay__content
    > div.v-sheet
) {
  overflow-y: visible;
}
.fake-link {
  cursor: pointer;
}
</style>
