<template>
  <div
    class="border-surface-700/50 bg-surface-800/30 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border px-2 py-1.5"
  >
    <UIcon name="i-mdi-remote" aria-hidden="true" class="text-surface-400 h-3.5 w-3.5" />
    <span
      v-for="item in items"
      :key="item.id"
      class="relative inline-flex items-center gap-1"
      @contextmenu="handleContextMenu($event, item)"
    >
      <AppTooltip :ui="{ content: 'p-0 h-auto rounded-lg overflow-hidden' }">
        <img
          :src="getKeyIconSrc(item)"
          :alt="item.name || item.shortName || item.id"
          loading="lazy"
          class="h-6 w-6 shrink-0 cursor-pointer rounded transition-opacity hover:opacity-80"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
          @click="openPrimaryLink(item)"
        />
        <template #content>
          <img
            :src="getKeyPreviewSrc(item)"
            :alt="item.name || item.shortName || item.id"
            loading="lazy"
            class="block h-32 w-32 object-contain"
            :class="getKeyBackgroundClass(item)"
          />
        </template>
      </AppTooltip>
      <AppTooltip :text="getPrimaryTooltip(item)">
        <a
          :href="getKeyPrimaryUrl(item)"
          target="_blank"
          rel="noopener noreferrer"
          class="text-link hover:text-link-hover focus-visible:ring-primary-500 inline-flex items-center gap-0.5 rounded-sm text-xs font-bold no-underline focus:outline-none focus-visible:ring-2"
          @click.stop
        >
          {{ item.shortName || item.name || item.id }}
          <UIcon name="i-mdi-open-in-new" class="text-surface-400 h-2.5 w-2.5 shrink-0" />
        </a>
      </AppTooltip>
      <AppTooltip :text="t('page.tasks.questcard.view_on_tarkov_dev')">
        <a
          :href="getKeyDevUrl(item)"
          target="_blank"
          rel="noopener noreferrer"
          class="text-surface-400 hover:text-surface-200 inline-flex items-center self-center rounded p-0.5 transition-colors"
          @click.stop
        >
          <img
            src="/img/logos/tarkovdevlogo.webp"
            :alt="t('page.tasks.questcard.tarkov_dev_logo')"
            class="h-3.5 w-3.5"
          />
        </a>
      </AppTooltip>
    </span>
    <AppTooltip :text="$t('page.tasks.questcard.equipment_disclaimer_tooltip')">
      <button
        type="button"
        class="text-surface-500 focus-visible:ring-primary-500 focus-visible:ring-offset-surface-900 hover:text-surface-300 inline-flex items-center self-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        :aria-label="$t('page.tasks.questcard.equipment_disclaimer_aria')"
        @click.stop
      >
        <UIcon name="i-mdi-information-outline" class="h-3.5 w-3.5" />
      </button>
    </AppTooltip>
    <ContextMenu ref="contextMenu">
      <template #default="{ close }">
        <ContextMenuItem
          v-if="activeItem?.wikiLink"
          icon="/img/logos/wikilogo.webp"
          :label="
            t('page.tasks.questcard.view_task_on_wiki', {
              name: activeItem?.name || activeItem?.shortName || '',
            })
          "
          @click="
            openWikiLink();
            close();
          "
        />
        <ContextMenuItem
          icon="/img/logos/tarkovdevlogo.webp"
          :label="
            t('quest.view_on_dev', {
              name: activeItem?.name || activeItem?.shortName || '',
            })
          "
          @click="
            openDevLink();
            close();
          "
        />
        <div v-if="activeItem?.name" class="border-surface-700 my-1 border-t" />
        <ContextMenuItem
          v-if="activeItem?.name"
          icon="i-mdi-content-copy"
          :label="$t('page.tasks.questcard.copy_equipment_name')"
          @click="
            copyItemName();
            close();
          "
        />
      </template>
    </ContextMenu>
  </div>
</template>
<script setup lang="ts">
  import { logger } from '@/utils/logger';
  import {
    getKeyBackgroundClass,
    getKeyDevUrl,
    getKeyIconSrc,
    getKeyPreviewSrc,
    getKeyPrimaryUrl,
  } from '@/utils/tarkovKeyHelpers';
  import type ContextMenu from '@/components/ui/ContextMenu.vue';
  import type { TarkovItem } from '@/types/tarkov';
  const { t } = useI18n({ useScope: 'global' });
  const props = defineProps<{ equipment: TarkovItem[] }>();
  const { copyToClipboard } = useCopyToClipboard();
  const contextMenu = ref<InstanceType<typeof ContextMenu>>();
  const activeItem = ref<TarkovItem>();
  const items = computed(() => {
    const seen = new Set<string>();
    return props.equipment.filter((item) => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  });
  const getPrimaryTooltip = (item: TarkovItem) =>
    item.wikiLink
      ? t('page.tasks.questcard.view_on_wiki')
      : t('page.tasks.questcard.view_on_tarkov_dev');
  const openPrimaryLink = (item: TarkovItem) => {
    window.open(getKeyPrimaryUrl(item), '_blank', 'noopener,noreferrer');
  };
  const handleContextMenu = (event: MouseEvent, item: TarkovItem) => {
    activeItem.value = item;
    contextMenu.value?.open(event);
  };
  const openDevLink = () => {
    if (activeItem.value) {
      window.open(getKeyDevUrl(activeItem.value), '_blank', 'noopener,noreferrer');
    }
  };
  const openWikiLink = () => {
    if (activeItem.value?.wikiLink) {
      window.open(activeItem.value.wikiLink, '_blank', 'noopener,noreferrer');
    }
  };
  const copyItemName = async () => {
    if (activeItem.value?.name) {
      try {
        await copyToClipboard(activeItem.value.name);
      } catch (error) {
        logger.error('Failed to copy equipment name', {
          error,
          itemName: activeItem.value?.name,
        });
      }
    }
  };
</script>
