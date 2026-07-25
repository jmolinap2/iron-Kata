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

export type MuscleProgress = {
  muscle: string;
  currentBest: number;
  previousBest: number;
  deltaPercent: number;
};

type MuscleSet = { muscle: string; weight: number; reps: number };

function bestEstimateByMuscle(sets: MuscleSet[]) {
  const best = new Map<string, number>();
  for (const set of sets) {
    const estimate = estimateOneRepMax(set.weight, set.reps);
    best.set(set.muscle, Math.max(best.get(set.muscle) ?? 0, estimate));
  }
  return best;
}

// Compara el mejor 1RM estimado por grupo muscular entre dos ventanas de
// tiempo (semana actual vs. semana anterior). Solo incluye músculos con
// datos en ambas ventanas — sin una línea base, un delta no dice nada.
export function muscleProgress(current: MuscleSet[], previous: MuscleSet[]): MuscleProgress[] {
  const currentBest = bestEstimateByMuscle(current);
  const previousBest = bestEstimateByMuscle(previous);
  const results: MuscleProgress[] = [];
  for (const [muscle, currentValue] of currentBest) {
    const previousValue = previousBest.get(muscle);
    if (!previousValue) continue;
    results.push({ muscle, currentBest: currentValue, previousBest: previousValue, deltaPercent: (currentValue - previousValue) / previousValue * 100 });
  }
  return results.sort((a, b) => b.deltaPercent - a.deltaPercent);
}
