import { useMetadataStore } from '@/stores/useMetadata';
import { logger } from '@/utils/logger';
import { buildItemImageUrl, buildItemPageUrl } from '@/utils/tarkovUrls';
import type { TarkovItem } from '@/types/tarkov';
export type LootState = 'idle' | 'searching' | 'found';
export interface LootItem {
  name: string;
  icon: string;
  rarity: string;
  colorClass: string;
  textClass: string;
  isRealItem: boolean;
  link: string;
  wikiLink?: string;
}
const FALLBACK_LOOT_TABLE: LootItem[] = [
  {
    name: 'Tushonka',
    icon: 'i-mdi-food-steak',
    rarity: 'Common',
    colorClass: 'text-warning-400',
    textClass: 'text-warning-100',
    isRealItem: false,
    link: '#',
  },
  {
    name: 'Bolts',
    icon: 'i-mdi-screw-machine-flat',
    rarity: 'Common',
    colorClass: 'text-rarity-common-400',
    textClass: 'text-rarity-common-200',
    isRealItem: false,
    link: '#',
  },
  {
    name: 'Duct Tape',
    icon: 'i-mdi-tape-drive',
    rarity: 'Uncommon',
    colorClass: 'text-rarity-uncommon-400',
    textClass: 'text-rarity-uncommon-100',
    isRealItem: false,
    link: '#',
  },
  {
    name: 'Graphics Card',
    icon: 'i-mdi-expansion-card',
    rarity: 'Rare',
    colorClass: 'text-rarity-rare-400',
    textClass: 'text-rarity-rare-100',
    isRealItem: false,
    link: '#',
  },
  {
    name: 'Tetriz',
    icon: 'i-mdi-gamepad-variant',
    rarity: 'Rare',
    colorClass: 'text-rarity-rare-400',
    textClass: 'text-rarity-rare-100',
    isRealItem: false,
    link: '#',
  },
  {
    name: 'Golden Rooster',
    icon: 'i-mdi-bird',
    rarity: 'Legendary',
    colorClass: 'text-rarity-legendary-400',
    textClass: 'text-rarity-legendary-100',
    isRealItem: false,
    link: '#',
  },
  {
    name: 'LedX',
    icon: 'i-mdi-hospital-box',
    rarity: 'Super Rare',
    colorClass: 'text-error-500',
    textClass: 'text-error-100',
    isRealItem: false,
    link: '#',
  },
  {
    name: 'Red Keycard',
    icon: 'i-mdi-card-account-details',
    rarity: 'Super Rare',
    colorClass: 'text-error-600',
    textClass: 'text-error-200',
    isRealItem: false,
    link: '#',
  },
  {
    name: 'Developer Coffee',
    icon: 'i-mdi-coffee',
    rarity: 'Easter Egg',
    colorClass: 'text-primary-400',
    textClass: 'text-primary-100',
    isRealItem: false,
    link: '#',
  },
];
const ITEM_IDS = {
  RED_KEYCARD: '5c05307b86f77468137a4473',
} as const;
function getRarityFromColor(color?: string) {
  switch (color) {
    case 'yellow':
    case 'orange':
      return {
        label: 'Legendary',
        color: 'text-rarity-legendary-400',
        text: 'text-rarity-legendary-100',
      };
    case 'violet':
    case 'purple':
      return { label: 'Rare', color: 'text-rarity-rare-400', text: 'text-rarity-rare-100' };
    case 'blue':
      return {
        label: 'Uncommon',
        color: 'text-rarity-uncommon-400',
        text: 'text-rarity-uncommon-100',
      };
    case 'green':
      return { label: 'Uncommon', color: 'text-success-400', text: 'text-success-100' };
    case 'red':
      return { label: 'Ultra Rare', color: 'text-error-500', text: 'text-error-100' };
    default:
      return { label: 'Common', color: 'text-rarity-common-400', text: 'text-rarity-common-200' };
  }
}
export function getRarityBadgeClass(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'legendary':
    case 'easter egg':
      return 'text-rarity-legendary-400';
    case 'super rare':
    case 'ultra rare':
      return 'text-error-400';
    case 'rare':
      return 'text-rarity-rare-400';
    case 'uncommon':
      return 'text-rarity-uncommon-400';
    default:
      return 'text-rarity-common-400';
  }
}
export function useLootGame() {
  const metadataStore = useMetadataStore();
  const lootState = ref<LootState>('idle');
  const searchProgress = ref(0);
  const searchIntervalId = ref<ReturnType<typeof setInterval> | null>(null);
  const foundItem = ref<LootItem | null>(null);
  const realItems = computed(() => {
    if (metadataStore.items.length > 0) {
      return metadataStore.items.filter((item) => item.iconLink || item.image512pxLink);
    }
    const items = new Map<string, TarkovItem>();
    metadataStore.neededItemTaskObjectives.forEach((obj) => {
      if (obj.item && (obj.item.iconLink || obj.item.image512pxLink)) {
        items.set(obj.item.id, obj.item);
      }
    });
    metadataStore.neededItemHideoutModules.forEach((mod) => {
      if (mod.item && (mod.item.iconLink || mod.item.image512pxLink)) {
        items.set(mod.item.id, mod.item);
      }
    });
    return Array.from(items.values());
  });
  const handleImageError = (event: Event) => {
    // Type guard: verify target is an HTMLImageElement
    if (!event.target || !(event.target instanceof HTMLImageElement)) {
      return;
    }
    const target = event.target;
    logger.warn('[LootGame] Image failed to load:', target.src);
    target.style.display = 'none';
    const currentItem = foundItem.value;
    if (currentItem?.isRealItem) {
      foundItem.value = {
        ...currentItem,
        isRealItem: false,
        icon: 'i-mdi-package-variant-closed',
        colorClass: currentItem.colorClass || 'text-surface-400',
      };
    }
  };
  const completeSearch = () => {
    searchProgress.value = 100;
    let item: LootItem;
    if (realItems.value.length > 0) {
      const randomReal = realItems.value[Math.floor(Math.random() * realItems.value.length)];
      if (randomReal) {
        const rarityInfo = getRarityFromColor(randomReal.backgroundColor);
        item = {
          name: randomReal.name || randomReal.shortName || 'Unknown Item',
          icon: randomReal.iconLink || randomReal.image512pxLink || '',
          rarity: rarityInfo.label,
          colorClass: rarityInfo.color,
          textClass: rarityInfo.text,
          isRealItem: true,
          link: randomReal.link || randomReal.wikiLink || buildItemPageUrl(randomReal.id),
        };
      } else {
        item = FALLBACK_LOOT_TABLE[0]!;
      }
    } else {
      const randomIndex = Math.floor(Math.random() * FALLBACK_LOOT_TABLE.length);
      item = FALLBACK_LOOT_TABLE[randomIndex] ?? FALLBACK_LOOT_TABLE[0]!;
    }
    foundItem.value = item;
    lootState.value = 'found';
  };
  const startSearch = async () => {
    // Clear any existing interval to prevent multiple timers
    if (searchIntervalId.value) {
      clearInterval(searchIntervalId.value);
      searchIntervalId.value = null;
    }
    lootState.value = 'searching';
    searchProgress.value = 0;
    // Wait for items to load before starting the search timer
    await metadataStore.ensureItemsFullLoaded().catch((error) => {
      logger.error('[LootGame] Failed to fetch full items data:', error);
    });
    searchIntervalId.value = setInterval(() => {
      searchProgress.value += Math.floor(Math.random() * 15) + 5;
      if (searchProgress.value >= 100) {
        if (searchIntervalId.value) {
          clearInterval(searchIntervalId.value);
          searchIntervalId.value = null;
        }
        completeSearch();
      }
    }, 200);
  };
  let isActivatingEasterEgg = false;
  const activateEasterEgg = async (onComplete?: () => void) => {
    if (isActivatingEasterEgg) return;
    isActivatingEasterEgg = true;
    lootState.value = 'searching';
    searchProgress.value = 50;
    try {
      await metadataStore.ensureItemsFullLoaded();
    } catch (error) {
      logger.error('[LootGame] Failed to fetch full items data for easter egg:', error);
      // Continue with fallback if fetch fails
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    searchProgress.value = 100;
    lootState.value = 'found';
    const redKeycard = realItems.value.find(
      (i) =>
        i.id === ITEM_IDS.RED_KEYCARD ||
        (i.name?.toLowerCase().includes('red') &&
          i.name?.toLowerCase().includes('keycard') &&
          i.name?.toLowerCase().includes('labs'))
    );
    // Create base object with common properties
    const baseItem: LootItem = {
      name: 'TerraGroup Labs access keycard (Red)',
      icon: buildItemImageUrl(ITEM_IDS.RED_KEYCARD),
      link: buildItemPageUrl(ITEM_IDS.RED_KEYCARD),
      wikiLink: buildItemPageUrl(ITEM_IDS.RED_KEYCARD),
      rarity: 'Legendary',
      colorClass: 'text-error-600 animate-pulse',
      textClass: 'text-error-200',
      isRealItem: true,
    };
    // Override with real item data if available
    if (redKeycard && (redKeycard.iconLink || redKeycard.image512pxLink)) {
      baseItem.name = redKeycard.name || baseItem.name;
      baseItem.icon = redKeycard.iconLink || redKeycard.image512pxLink || baseItem.icon;
      baseItem.link = redKeycard.link || redKeycard.wikiLink || baseItem.link;
      baseItem.wikiLink = redKeycard.wikiLink || redKeycard.link || baseItem.wikiLink;
    }
    foundItem.value = baseItem;
    onComplete?.();
    isActivatingEasterEgg = false;
  };
  const resetSearch = () => {
    if (searchIntervalId.value) {
      clearInterval(searchIntervalId.value);
      searchIntervalId.value = null;
    }
    searchProgress.value = 0;
    foundItem.value = null;
    lootState.value = 'idle';
  };
  // Cleanup interval on unmount to prevent memory leaks
  onUnmounted(() => {
    if (searchIntervalId.value) {
      clearInterval(searchIntervalId.value);
      searchIntervalId.value = null;
    }
  });
  return {
    lootState,
    searchProgress,
    foundItem,
    startSearch,
    resetSearch,
    activateEasterEgg,
    handleImageError,
  };
}
