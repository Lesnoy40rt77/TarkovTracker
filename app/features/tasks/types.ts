/**
 * Visual state for task action buttons.
 * - 'locked': Task prerequisites not met
 * - 'complete': Task already completed, show undo option
 * - 'hotwheels': Special Hot Wheels crossover task with both complete/fail options
 * - 'available': Task can be marked complete
 * - 'none': No action available (e.g., wrong faction)
 */
export type ActionButtonState = 'locked' | 'complete' | 'hotwheels' | 'available' | 'none';
