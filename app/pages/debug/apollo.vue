<template>
  <v-container>
    <v-card>
      <v-card-title>Apollo GraphQL Debug Page</v-card-title>
      <v-card-subtitle>Testing Tarkov API Data Fetching</v-card-subtitle>

      <v-card-text>
        <v-alert v-if="loading" type="info" class="mb-4">
          Loading data from GraphQL API...
        </v-alert>

        <v-alert v-if="error" type="error" class="mb-4">
          <strong>Error:</strong> {{ error.message }}
        </v-alert>

        <div v-if="result" class="debug-data">
          <h3 class="mb-3">Query Results:</h3>

          <!-- Traders -->
          <v-expansion-panels class="mb-4">
            <v-expansion-panel>
              <v-expansion-panel-title>
                Traders ({{ result.traders?.length || 0 }})
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list dense>
                  <v-list-item
                    v-for="trader in result.traders"
                    :key="trader.id"
                  >
                    {{ trader.name }}
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Tasks -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                Tasks ({{ result.tasks?.length || 0 }})
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list dense>
                  <v-list-item
                    v-for="task in result.tasks?.slice(0, 10)"
                    :key="task.id"
                  >
                    {{ task.name }} - {{ task.trader?.name }}
                  </v-list-item>
                  <v-list-item v-if="result.tasks?.length > 10">
                    ... and {{ result.tasks.length - 10 }} more
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Maps -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                Maps ({{ result.maps?.length || 0 }})
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list dense>
                  <v-list-item v-for="map in result.maps" :key="map.id">
                    {{ map.name }}
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Player Levels -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                Player Levels ({{ result.playerLevels?.length || 0 }})
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="text-caption">
                  First 5:
                  {{
                    result.playerLevels
                      ?.slice(0, 5)
                      .map((l) => l.level)
                      .join(", ")
                  }}
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-divider class="my-4" />

          <div class="debug-info">
            <strong>Language:</strong> {{ languageCode }}<br />
            <strong>Game Mode:</strong> {{ gameMode }}
          </div>
        </div>

        <v-btn
          color="primary"
          :loading="loading"
          class="mt-4"
          @click="refetch()"
        >
          Refetch Data
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTarkovDataQuery } from "@/composables/api/useTarkovApi";
import { useTarkovStore } from "@/stores/tarkov";

const tarkovStore = useTarkovStore();
const gameMode = computed(() => tarkovStore.getCurrentGameMode() || "regular");

const { result, error, loading, refetch, languageCode } =
  useTarkovDataQuery(gameMode);
</script>

<style scoped>
.debug-data {
  max-height: 600px;
  overflow-y: auto;
}

.debug-info {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}
</style>
