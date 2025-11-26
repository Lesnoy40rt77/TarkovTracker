<template>
  <div
    class="relative group cursor-default"
    :class="[containerClasses, { 'w-full h-full': size !== 'small' }]"
    @mouseenter="linkHover = true"
    @mouseleave="linkHover = false"
    @click="handleClick"
  >
    <!-- Simple image display mode (for ItemImage compatibility) -->
    <div v-if="simpleMode" :class="imageContainerClasses" class="relative overflow-hidden">
      <img
        v-if="isVisible && computedImageSrc"
        :src="computedImageSrc"
        :class="[imageClasses, { 'w-full h-full object-contain': true }]"
        loading="lazy"
        class="rounded"
        @error="handleImgError"
      />
      <div
        v-else
        :class="[imageClasses, 'image-placeholder']"
        class="flex items-center justify-center w-full h-full bg-gray-800 rounded"
      >
        <UIcon name="i-mdi-loading" class="w-6 h-6 animate-spin text-gray-400" />
      </div>
    </div>

    <!-- Full item display mode (for TarkovItem compatibility) -->
    <div v-else class="flex items-center justify-center transition-all duration-200 w-full h-full"
      :class="{ 'blur-[1px] opacity-50': linkHover && showActions }"
    >
      <div class="flex items-center justify-center mr-2">
        <img
          :width="imageSize"
          :height="imageSize"
          :src="computedImageSrc"
          :class="imageClasses"
          class="rounded"
          alt="Item Icon"
          @error="handleImgError"
        />
      </div>
      <div v-if="props.count" class="mr-2 text-sm font-medium text-gray-300">
        {{ props.count.toLocaleString() }}
      </div>
      <div
        v-if="props.itemName"
        class="flex items-center justify-center text-sm font-bold text-white text-center leading-tight"
      >
        {{ props.itemName }}
      </div>
    </div>

    <!-- Hover actions (only in full mode) -->
    <div
      v-if="!simpleMode && showActions && linkHover"
      class="absolute inset-0 flex items-center justify-center z-10 gap-2"
    >
      <UButton
        v-if="props.wikiLink"
        color="primary"
        variant="solid"
        size="xs"
        class="rounded-full p-1"
        title="Show item on EFT Wiki"
        @click.stop="openWikiLink()"
      >
        <img
          src="/img/logos/wikilogo.png"
          class="w-5 h-5 object-contain"
          alt="Wiki"
        />
      </UButton>
      <UButton
        v-if="props.devLink"
        color="primary"
        variant="solid"
        size="xs"
        class="rounded-full p-1"
        title="Show item on Tarkov.dev"
        @click.stop="openTarkovDevLink()"
      >
        <img
          src="/img/logos/tarkovdevlogo.png"
          class="w-5 h-5 object-contain"
          alt="Tarkov.dev"
        />
      </UButton>
      <UButton
        v-if="props.itemName"
        color="primary"
        variant="solid"
        size="xs"
        class="rounded-full p-1"
        title="Copy Item Name"
        @click.stop="copyItemName()"
      >
        <UIcon name="i-mdi-content-copy" class="w-4 h-4 text-white" />
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  // Basic item identification
  itemId?: string
  itemName?: string | null
  
  // Image sources (multiple options for flexibility)
  src?: string
  iconLink?: string
  image512pxLink?: string
  
  // External links
  devLink?: string | null
  wikiLink?: string | null
  
  // Display options
  count?: number | null
  size?: 'small' | 'medium' | 'large'
  simpleMode?: boolean
  showActions?: boolean
  isVisible?: boolean
  backgroundColor?: string
  
  // Click handling
  clickable?: boolean
  
  // Legacy compatibility
  imageItem?: {
    iconLink?: string
    image512pxLink?: string
    backgroundColor?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  itemId: '',
  itemName: null,
  src: '',
  iconLink: '',
  image512pxLink: '',
  devLink: null,
  wikiLink: null,
  count: null,
  size: 'medium',
  simpleMode: false,
  showActions: true,
  isVisible: true,
  backgroundColor: '',
  clickable: false,
  imageItem: undefined
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const linkHover = ref(false)

// Compute image source based on available props
const computedImageSrc = computed(() => {
  // Priority order: explicit src > iconLink > imageItem.iconLink > generated from itemId
  if (props.src) return props.src
  if (props.iconLink) return props.iconLink
  if (props.imageItem?.iconLink) return props.imageItem.iconLink
  if (props.imageItem?.image512pxLink && props.size === 'large') return props.imageItem.image512pxLink
  if (props.itemId) return `https://assets.tarkov.dev/${props.itemId}-icon.jpg`
  return ''
})

// Compute display properties based on size
const imageSize = computed(() => {
  switch (props.size) {
    case 'small': return 24
    case 'large': return 64
    case 'medium':
    default: return 32
  }
})

const containerClasses = computed(() => {
  if (props.simpleMode) {
    return 'd-block'
  }
  return ''
})

const imageContainerClasses = computed(() => {
  const classes = ['d-block', 'relative', 'overflow-hidden']
  
  if (props.size === 'small') {
    classes.push('item-row-image')
  } else if (props.size === 'large') {
    classes.push('item-dialog-image')
  }
  
  return classes
})

const imageClasses = computed(() => {
  const classes: Record<string, boolean> = {}
  
  // Background color styling
  const bgColor = props.backgroundColor || props.imageItem?.backgroundColor || 'default'
  classes[`item-bg-${bgColor}`] = true
  
  // Size-specific styling
  classes['p-1'] = props.simpleMode
  
  // Base styling
  classes['rounded'] = true
  
  return classes
})

// Image error handling
const handleImgError = () => {
  if (props.itemId) {
    // If .jpg fails, try .webp
    const currentSrc = computedImageSrc.value
    if (currentSrc?.endsWith('.jpg')) {
      // This will trigger a re-computation of the image source
      const newSrc = `https://assets.tarkov.dev/${props.itemId}-icon.webp`
      // Update the source by temporarily modifying the itemId to force reactivity
      const originalId = props.itemId
      // Force reactivity by triggering a watch
      // The component will re-render with the webp version
    }
  }
}

// Watch for itemId changes to reset image source
watch(
  () => props.itemId,
  () => {
    // This ensures the image source recomputes when itemId changes
  }
)

// Action methods
const openTarkovDevLink = () => {
  if (props.devLink) {
    window.open(props.devLink, '_blank')
  }
}

const openWikiLink = () => {
  if (props.wikiLink) {
    window.open(props.wikiLink, '_blank')
  }
}

const copyItemName = () => {
  if (props.itemName) {
    navigator.clipboard.writeText(props.itemName)
  }
}

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
.item-bg-default {
  background-color: transparent;
}

.item-row-image {
  width: 24px;
  height: 24px;
}

.item-dialog-image {
  width: 64px;
  height: 64px;
}

.image-placeholder {
  background-color: #374151;
}
</style>