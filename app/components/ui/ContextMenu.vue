<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        ref="menuRef"
        role="menu"
        tabindex="-1"
        class="context-menu border-surface-700 bg-surface-900 fixed z-9999 min-w-45 overflow-hidden rounded-lg border shadow-xl"
        :style="{ top: `${y}px`, left: `${x}px` }"
        @click.stop
        @keydown="handleMenuKeydown"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </Teleport>
</template>
<script setup lang="ts">
  import { onClickOutside } from '@vueuse/core';
  const visible = ref(false);
  const x = ref(0);
  const y = ref(0);
  const menuRef = ref<HTMLElement>();
  const getMenuItems = (): HTMLElement[] => {
    if (!menuRef.value) return [];
    return Array.from(
      menuRef.value.querySelectorAll('[role="menuitem"], button, a')
    ) as HTMLElement[];
  };
  const focusFirstItem = () => {
    nextTick(() => {
      const items = getMenuItems();
      if (items.length > 0) {
        items[0]?.focus();
      } else {
        menuRef.value?.focus();
      }
    });
  };
  const handleMenuKeydown = (event: KeyboardEvent) => {
    const items = getMenuItems();
    if (!items.length) return;
    const currentIndex = items.findIndex((item) => item === document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };
  const open = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    x.value = event.clientX;
    y.value = event.clientY;
    visible.value = true;
    // Adjust position if menu goes off-screen
    nextTick(() => {
      if (menuRef.value) {
        const rect = menuRef.value.getBoundingClientRect();
        const padding = 8;
        if (rect.right > window.innerWidth - padding) {
          x.value = Math.max(padding, window.innerWidth - rect.width - padding);
        }
        if (rect.bottom > window.innerHeight - padding) {
          y.value = Math.max(padding, window.innerHeight - rect.height - padding);
        }
        if (x.value < padding) x.value = padding;
        if (y.value < padding) y.value = padding;
      }
    });
  };
  const close = () => {
    visible.value = false;
  };
  watch(visible, (isVisible) => {
    if (isVisible) {
      focusFirstItem();
    }
  });
  onClickOutside(menuRef, close);
  const handleGlobalKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && visible.value) {
      close();
    }
  };
  onMounted(() => {
    document.addEventListener('keydown', handleGlobalKeydown);
  });
  onUnmounted(() => {
    document.removeEventListener('keydown', handleGlobalKeydown);
  });
  defineExpose({ open, close });
</script>
