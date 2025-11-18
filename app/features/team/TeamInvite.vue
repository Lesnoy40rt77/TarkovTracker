<template>
  <v-alert
    v-if="hasInviteInUrl && !inInviteTeam && !declined"
    color="green"
    theme="dark"
    icon="mdi-handshake"
    density="compact"
    prominent
  >
    <div class="d-flex flex-row align-center justify-space-between">
      <div>
        {{ $t("page.team.card.teaminvite.description") }}
      </div>
      <div>
        <v-btn
          class="mx-1 my-1"
          variant="outlined"
          :disabled="accepting"
          :loading="accepting"
          @click="acceptInvite"
        >
          {{ $t("page.team.card.teaminvite.accept") }}
        </v-btn>
        <v-btn
          variant="outlined"
          :disabled="accepting"
          @click="declined = true"
        >
          {{ $t("page.team.card.teaminvite.decline") }}
        </v-btn>
      </div>
    </div>
  </v-alert>
  <v-snackbar v-model="joinTeamSnackbar" :timeout="4000" color="accent">
    {{ joinResult }}
    <template #actions>
      <v-btn color="white" variant="text" @click="joinTeamSnackbar = false">
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>
<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
// import { auth } from '@/plugins/firebase.client';
// import { useLiveData } from '@/composables/livedata';
// import { getFunctions, httpsCallable } from 'firebase/functions';
import { useSystemStore } from "@/stores/useSystemStore";

// const router = useRouter();
// const { useSystemStore } = useLiveData();
const systemStore = useSystemStore();
// const { t } = useI18n({ useScope: "global" });
const route = useRoute();

// const functions = getFunctions();
// const joinTeamCallable = httpsCallable(functions, 'joinTeam');
// const leaveTeamCallable = httpsCallable(functions, 'leaveTeam');

const hasInviteInUrl = computed(() => {
  return !!(route.query.team && route.query.code);
});
const inInviteTeam = computed(() => {
  return (
    systemStore?.userTeam != null && systemStore.userTeam == route?.query?.team
  );
});
const declined = ref(false);
const accepting = ref(false);
const joinTeamSnackbar = ref(false);
const joinResult = ref("");

const acceptInvite = async () => {
  // TODO: Implement Supabase team joining logic
  console.warn("Team joining not yet implemented for Supabase");
  joinResult.value = "Team joining is currently disabled during migration.";
  joinTeamSnackbar.value = true;
};
</script>
<style lang="scss" scoped></style>
