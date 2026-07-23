import type { Routine, WorkoutSession } from '../types';

export function nextRoutine(routines: Routine[], sessions: WorkoutSession[]): Routine | null {
  const sequence = routines.filter(item => item.active).sort((a, b) => a.orderIndex - b.orderIndex);
  if (!sequence.length) return null;
  const lastCompleted = sessions.find(item => item.status === 'completed' && !item.isQuick);
  if (!lastCompleted) return sequence[0];
  const index = sequence.findIndex(item => item.id === lastCompleted.routineId);
  if (index < 0) return sequence[0];
  return sequence[(index + 1) % sequence.length];
}

export function estimateOneRepMax(weight: number, reps: number) {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

export function isNewRecord(estimate: number, previousBest: number) {
  return estimate > previousBest + 0.05;
}
