import type { PerformedSet, Routine, WorkoutSession } from '../types';

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

// Días consecutivos con al menos una sesión completada (entrenamiento o
// descanso — ambos cuentan como "seguir el plan"), contando hacia atrás
// desde hoy. Si hoy todavía no se completó nada, no rompe la racha: sigue
// contando desde ayer.
export function trainingStreak(sessions: WorkoutSession[], now: Date = new Date()): number {
  const dateKey = (value: string) => new Date(value).toDateString();
  const trainedDays = new Set(
    sessions.filter(item => item.status === 'completed').map(item => dateKey(item.completedAt ?? item.startedAt)),
  );
  const cursor = new Date(now);
  if (!trainedDays.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (trainedDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Reparte el tiempo de una sesión entre sus ejercicios sin necesitar un
// cronómetro por ejercicio: cada serie ya tiene su hora exacta. El tiempo
// entre una serie y la anterior (o el inicio de la sesión, para la primera)
// se le atribuye al ejercicio de esa serie. La suma de todo da exactamente
// el tiempo entre el inicio de la sesión y la última serie registrada.
export function exerciseDurationsMs(startedAt: string, sets: PerformedSet[]): Record<string, number> {
  const sorted = [...sets].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  const durations: Record<string, number> = {};
  let previous = new Date(startedAt).getTime();
  for (const set of sorted) {
    const time = new Date(set.completedAt).getTime();
    durations[set.exerciseId] = (durations[set.exerciseId] ?? 0) + Math.max(0, time - previous);
    previous = time;
  }
  return durations;
}
