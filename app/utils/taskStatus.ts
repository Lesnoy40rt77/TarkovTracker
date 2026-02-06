export type RawTaskCompletion =
  | { complete?: boolean; failed?: boolean; timestamp?: number }
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
/**
 * Checks if a task is complete (not failed).
 * Note: A task with both complete:true and failed:true is treated as failed,
 * so this returns false in that edge case. Failed takes precedence.
 */
export function isTaskComplete(completion?: RawTaskCompletion): boolean {
  const flags = getCompletionFlags(completion);
  return flags.complete && !flags.failed;
}
/**
 * Checks if a task is failed.
 * Note: Failed takes precedence - a {complete:true, failed:true} state is treated as failed.
 */
export function isTaskFailed(completion?: RawTaskCompletion): boolean {
  return getCompletionFlags(completion).failed;
}
/**
 * Checks if a task is actively in progress (started but not completed or failed).
 * Returns false for:
 * - undefined/null: No completion record exists (task not started)
 * - false: Task exists but explicitly not started
 * - Completed tasks (isTaskComplete returns true)
 * - Failed tasks (isTaskFailed returns true)
 * @see isTaskComplete for checking task completion
 * @see isTaskFailed for checking task failure
 */
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
