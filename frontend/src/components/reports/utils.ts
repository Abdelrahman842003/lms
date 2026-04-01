/**
 * Shared utility functions for report components.
 */

export const directionIcon = (direction: string): string => {
  if (direction === 'up') return '↑';
  if (direction === 'down') return '↓';
  return '→';
};

export const directionColor = (direction: string, invert = false): string => {
  if (direction === 'stable') return 'text-gray-400';
  const isUp = direction === 'up';
  const good = invert ? !isUp : isUp;
  return good ? 'text-green-400' : 'text-red-400';
};
