import { describe, it, expect } from 'vitest';
import {
  getCompletionFlags,
  isTaskComplete,
  isTaskFailed,
  isTaskActive,
  getTaskStatusFromFlags,
} from '../useTaskStatus';
describe('useTaskStatus', () => {
  describe('getCompletionFlags', () => {
    it('handles boolean true -> {complete: true, failed: false}', () => {
      expect(getCompletionFlags(true)).toEqual({ complete: true, failed: false });
    });
    it('handles boolean false -> {complete: false, failed: false}', () => {
      expect(getCompletionFlags(false)).toEqual({ complete: false, failed: false });
    });
    it('handles object {complete: true} -> {complete: true, failed: false}', () => {
      expect(getCompletionFlags({ complete: true })).toEqual({ complete: true, failed: false });
    });
    it('handles object {failed: true} -> {complete: false, failed: true}', () => {
      expect(getCompletionFlags({ failed: true })).toEqual({ complete: false, failed: true });
    });
    it('handles object {complete: true, failed: true} -> {complete: true, failed: true}', () => {
      expect(getCompletionFlags({ complete: true, failed: true })).toEqual({
        complete: true,
        failed: true,
      });
    });
    it('handles null -> {complete: false, failed: false}', () => {
      expect(getCompletionFlags(null)).toEqual({ complete: false, failed: false });
    });
    it('handles undefined -> {complete: false, failed: false}', () => {
      expect(getCompletionFlags(undefined)).toEqual({ complete: false, failed: false });
    });
  });
  describe('isTaskComplete', () => {
    it('returns true only when complete && !failed', () => {
      expect(isTaskComplete({ complete: true })).toBe(true);
      expect(isTaskComplete(true)).toBe(true);
    });
    it('returns false when complete && failed', () => {
      expect(isTaskComplete({ complete: true, failed: true })).toBe(false);
    });
    it('returns false when not complete', () => {
      expect(isTaskComplete({ complete: false })).toBe(false);
      expect(isTaskComplete(false)).toBe(false);
      expect(isTaskComplete(null)).toBe(false);
      expect(isTaskComplete(undefined)).toBe(false);
    });
  });
  describe('isTaskFailed', () => {
    it('returns true when failed', () => {
      expect(isTaskFailed({ failed: true })).toBe(true);
      expect(isTaskFailed({ complete: false, failed: true })).toBe(true);
      expect(isTaskFailed({ complete: true, failed: true })).toBe(true);
    });
    it('returns false when not failed', () => {
      expect(isTaskFailed({ failed: false })).toBe(false);
      expect(isTaskFailed({ complete: true })).toBe(false);
      expect(isTaskFailed(true)).toBe(false);
      expect(isTaskFailed(false)).toBe(false);
      expect(isTaskFailed(null)).toBe(false);
      expect(isTaskFailed(undefined)).toBe(false);
    });
  });
  describe('isTaskActive', () => {
    it('returns false for null/undefined', () => {
      expect(isTaskActive(null)).toBe(false);
      expect(isTaskActive(undefined)).toBe(false);
    });
    it('returns false for completed tasks', () => {
      expect(isTaskActive({ complete: true })).toBe(false);
      expect(isTaskActive(true)).toBe(false);
    });
    it('returns false for failed tasks', () => {
      expect(isTaskActive({ failed: true })).toBe(false);
    });
    it('returns true for active tasks (started but not completed/failed)', () => {
      expect(isTaskActive({ complete: false, failed: false })).toBe(true);
    });
    it('returns false for boolean false (treated as no completion record)', () => {
      expect(isTaskActive(false)).toBe(false);
    });
  });
  describe('getTaskStatusFromFlags', () => {
    it('returns "completed" when complete && !failed', () => {
      expect(getTaskStatusFromFlags({ complete: true })).toBe('completed');
      expect(getTaskStatusFromFlags(true)).toBe('completed');
    });
    it('returns "failed" when failed (regardless of complete)', () => {
      expect(getTaskStatusFromFlags({ failed: true })).toBe('failed');
      expect(getTaskStatusFromFlags({ complete: true, failed: true })).toBe('failed');
    });
    it('returns "incomplete" otherwise', () => {
      expect(getTaskStatusFromFlags({ complete: false })).toBe('incomplete');
      expect(getTaskStatusFromFlags(false)).toBe('incomplete');
      expect(getTaskStatusFromFlags(null)).toBe('incomplete');
      expect(getTaskStatusFromFlags(undefined)).toBe('incomplete');
    });
  });
});
