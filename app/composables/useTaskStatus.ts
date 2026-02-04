export type RawTaskCompletion =
  | { complete?: boolean; failed?: boolean }
  | boolean
  | null
  | undefined;
export type TaskStatusResult = 'completed' | 'failed' | 'incomplete';
export function getCompletionFlags(completion: RawTaskCompletion): {
  complete: boolean;
  failed: boolean;
} {
  if (typeof completion === 'boolean') {
    return { complete: completion, failed: false };
  }
  return {
    complete: completion?.complete === true,
    failed: completion?.failed === true,
  };
}
export function isTaskComplete(completion?: RawTaskCompletion): boolean {
  const flags = getCompletionFlags(completion);
  return flags.complete && !flags.failed;
}
export function isTaskFailed(completion?: RawTaskCompletion): boolean {
  return getCompletionFlags(completion).failed;
}
export function isTaskActive(completion?: RawTaskCompletion): boolean {
  if (!completion) return false;
  return !isTaskComplete(completion) && !isTaskFailed(completion);
}
export function getTaskStatusFromFlags(completion?: RawTaskCompletion): TaskStatusResult {
  const flags = getCompletionFlags(completion);
  if (flags.failed) return 'failed';
  if (flags.complete) return 'completed';
  return 'incomplete';
}
