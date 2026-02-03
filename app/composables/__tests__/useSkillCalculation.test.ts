/**
 * Test file for useSkillCalculation composable
 */
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSkillCalculation } from '@/composables/useSkillCalculation';
import { useMetadataStore } from '@/stores/useMetadata';
import { logger } from '@/utils/logger';
// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));
describe('useSkillCalculation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const metadataStore = useMetadataStore();
    metadataStore.tasks = [];
    vi.clearAllMocks();
  });
  it('sets total skill level correctly', () => {
    const { setTotalSkillLevel, totalSkills } = useSkillCalculation();
    const skillName = 'Strength';
    setTotalSkillLevel(skillName, 10);
    expect(totalSkills.value[skillName]).toBe(10);
  });
  it('validates and clamps totalLevel input', () => {
    const { setTotalSkillLevel, totalSkills } = useSkillCalculation();
    const skillName = 'Strength';
    setTotalSkillLevel(skillName, -5);
    expect(totalSkills.value[skillName] || 0).toBe(0);
    setTotalSkillLevel(skillName, 100);
    expect(totalSkills.value[skillName]).toBe(51);
    setTotalSkillLevel(skillName, NaN);
    expect(totalSkills.value[skillName]).toBe(51);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Invalid totalLevel "NaN" for skill "Strength"')
    );
    const previousValue = totalSkills.value[skillName];
    setTotalSkillLevel(skillName, Infinity);
    expect(totalSkills.value[skillName]).toBe(previousValue);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Invalid totalLevel "Infinity" for skill "Strength"')
    );
  });
  it('coerces totalLevel to integer', () => {
    const { setTotalSkillLevel, totalSkills } = useSkillCalculation();
    const skillName = 'Strength';
    setTotalSkillLevel(skillName, 10.7);
    expect(totalSkills.value[skillName]).toBe(10);
  });
});
