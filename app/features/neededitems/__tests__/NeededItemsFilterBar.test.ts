import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
const UButtonStub = {
  props: ['icon'],
  emits: ['click'],
  template: '<button :data-icon="icon" @click="$emit(\'click\')"><slot /></button>',
};
const UInputStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};
const setup = async () => {
  vi.resetModules();
  const { default: NeededItemsFilterBar } =
    await import('@/features/neededitems/NeededItemsFilterBar.vue');
  return NeededItemsFilterBar;
};
const createDefaultProps = () => ({
  modelValue: 'all' as const,
  search: '',
  viewMode: 'list' as const,
  filterTabs: [
    { label: 'All', value: 'all' as const, icon: 'i-mdi-format-list-bulleted', count: 3 },
  ],
  totalCount: 3,
  ungroupedCount: 3,
  firFilter: 'all' as const,
  groupByItem: false,
  hideTeamItems: false,
  hideNonFirSpecialEquipment: false,
  kappaOnly: false,
});
const createDefaultGlobal = () => ({
  mocks: {
    $t: (key: string, fallback?: string) => fallback ?? key,
  },
  stubs: {
    AppTooltip: { template: '<span><slot /></span>' },
    UBadge: true,
    UButton: UButtonStub,
    UIcon: true,
    UInput: UInputStub,
    UPopover: { template: '<div><slot /><slot name="content" /></div>' },
  },
});
describe('NeededItemsFilterBar', () => {
  it('emits update:search after setting input value', async () => {
    const NeededItemsFilterBar = await setup();
    const wrapper = mount(NeededItemsFilterBar, {
      props: createDefaultProps(),
      global: createDefaultGlobal(),
    });
    await wrapper.find('input').setValue('gpu');
    expect(wrapper.emitted('update:search')).toEqual([['gpu']]);
  });
  it('emits update:viewMode after triggering list view button', async () => {
    const NeededItemsFilterBar = await setup();
    const wrapper = mount(NeededItemsFilterBar, {
      props: createDefaultProps(),
      global: createDefaultGlobal(),
    });
    await wrapper.find('button[data-icon="i-mdi-view-list"]').trigger('click');
    expect(wrapper.emitted('update:viewMode')).toEqual([['list']]);
  });
  it('emits update:groupByItem when toggle button is clicked', async () => {
    const NeededItemsFilterBar = await setup();
    const wrapper = mount(NeededItemsFilterBar, {
      props: createDefaultProps(),
      global: createDefaultGlobal(),
    });
    // No initial emission on mount
    expect(wrapper.emitted('update:groupByItem')).toBeUndefined();
    // Trigger toggle and check emission
    await wrapper.find('button[data-icon="i-mdi-group"]').trigger('click');
    expect(wrapper.emitted('update:groupByItem')).toEqual([[true]]);
  });
});
