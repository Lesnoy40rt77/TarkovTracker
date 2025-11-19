<template>
  <v-list nav bg-color="transparent" class="mx-auto">
    <DrawerItem
      icon="mdi-view-dashboard"
      locale-key="home"
      to="/"
      :is-collapsed="props.isCollapsed"
    >
    </DrawerItem>
    <DrawerItem
      icon="mdi-clipboard-text-multiple"
      locale-key="tasks"
      to="/tasks"
      :is-collapsed="props.isCollapsed"
    >
    </DrawerItem>
    <DrawerItem
      icon="mdi-list-box"
      locale-key="neededitems"
      to="/items"
      :is-collapsed="props.isCollapsed"
    >
    </DrawerItem>
    <DrawerItem
      icon="mdi-home"
      locale-key="hideout"
      to="/hideout"
      :is-collapsed="props.isCollapsed"
    >
    </DrawerItem>
    <DrawerItem
      v-show="fireuser.loggedIn"
      icon="mdi-account-group"
      locale-key="team"
      to="/team"
      :is-collapsed="props.isCollapsed"
    >
    </DrawerItem>
    <DrawerItem
      icon="mdi-api"
      locale-key="api"
      to="/api"
      :is-collapsed="props.isCollapsed"
    >
    </DrawerItem>
  </v-list>
</template>
<script setup>
import { computed, defineAsyncComponent } from "vue";
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    required: true,
  },
});
const { $supabase } = useNuxtApp();
const fireuser = computed(() => ({
  loggedIn: $supabase.user?.loggedIn ?? false,
}));
const DrawerItem = defineAsyncComponent(
  () => import("@/features/drawer/DrawerItem.vue")
);
</script>
<style lang="scss" scoped></style>
