<template>
  <div class="inline-block">
    <div class="text-surface-400 mb-2 text-xs font-medium">
      {{ $t('page.tasks.questcard.keys_header', 'Suggested Keys') }}
      <span class="text-surface-500 font-normal">
        {{ $t('page.tasks.questcard.keys_subtext', '(may help but not always required)') }}
      </span>
    </div>
    <div
      v-for="(keyMap, keyMapIndex) in neededKeys"
      :key="keyMapIndex"
      class="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1"
    >
      <i18n-t
        keypath="page.tasks.questcard.keys_needed"
        :plural="keyMap.keys.length"
        scope="global"
      >
        <template #keys>
          <span v-for="(key, keyIndex) in keyMap.keys" :key="keyIndex" class="inline-block">
            <GameItem
              :item-id="key.id"
              :item-name="`${key.name} (${key.shortName})`"
              :copy-value="key.name"
              :dev-link="key.link"
              :wiki-link="key.wikiLink"
              :count="1"
              size="xs"
            />
          </span>
        </template>
        <template #map>
          {{ keyMap.map.name }}
        </template>
      </i18n-t>
    </div>
  </div>
</template>
<script setup>
  defineProps({
    neededKeys: { type: Array, required: true },
  });
</script>
