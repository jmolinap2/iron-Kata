import { describe, expect, it } from 'vitest';

import { estimateOneRepMax, exerciseDurationsMs, isNewRecord, muscleProgress, nextRoutine, trainingStreak } from './rules';
import type { PerformedSet, Routine, WorkoutSession } from '../types';

const routine = (id: string, orderIndex: number, isRest = false): Routine => ({
  id, name: id, orderIndex, isRest, active: true,
  muscles: isRest ? ['Descanso'] : ['Espalda'], exercises: [],
});
const session = (routineId: string, isQuick = false): WorkoutSession => ({
  id: `s-${routineId}`, routineId, routineName: routineId,
  startedAt: '2026-07-20T10:00:00.000Z', completedAt: '2026-07-20T11:00:00.000Z',
  status: 'completed', isQuick, sets: [],
});

describe('secuencia de entrenamiento', () => {
  const routines = [routine('espalda', 0), routine('pierna', 1), routine('descanso', 2, true)];

  it('empieza por el primer bloque sin historial', () => {
    expect(nextRoutine(routines, [])?.id).toBe('espalda');
  });

  it('continúa desde la última sesión completada aunque pase otro día', () => {
    expect(nextRoutine(routines, [session('espalda')])?.id).toBe('pierna');
  });

  it('incluye el descanso como parte real de la secuencia', () => {
    expect(nextRoutine(routines, [session('pierna')])?.id).toBe('descanso');
  });

  it('vuelve al inicio después de completar el descanso', () => {
    expect(nextRoutine(routines, [session('descanso')])?.id).toBe('espalda');
  });

  it('un entrenamiento rápido no altera la secuencia principal', () => {
    expect(nextRoutine(routines, [session('pierna', true), session('espalda')])?.id).toBe('pierna');
  });

  it('un entrenamiento libre no reinicia la secuencia principal', () => {
    expect(nextRoutine(routines, [session('manual'), session('espalda')])?.id).toBe('pierna');
  });
});

describe('récords de fuerza', () => {
  it('calcula 1RM estimado con Epley', () => {
    expect(estimateOneRepMax(60, 10)).toBeCloseTo(80, 5);
  });

  it('solo celebra cuando supera el mejor valor', () => {
    expect(isNewRecord(80.1, 80)).toBe(true);
    expect(isNewRecord(80, 80)).toBe(false);
  });
});

describe('progreso de fuerza por grupo muscular', () => {
  it('ordena de mayor a menor mejora y calcula el delta correcto', () => {
    const current = [
      { muscle: 'Piernas', weight: 100, reps: 5 },
      { muscle: 'Espalda', weight: 60, reps: 8 },
    ];
    const previous = [
      { muscle: 'Piernas', weight: 80, reps: 5 },
      { muscle: 'Espalda', weight: 58, reps: 8 },
    ];
    const result = muscleProgress(current, previous);
    expect(result.map(item => item.muscle)).toEqual(['Piernas', 'Espalda']);
    expect(result[0].deltaPercent).toBeCloseTo((100 * (1 + 5 / 30) - 80 * (1 + 5 / 30)) / (80 * (1 + 5 / 30)) * 100, 5);
  });

  it('ignora músculos sin línea base en la semana anterior', () => {
    const current = [{ muscle: 'Hombros', weight: 40, reps: 10 }];
    const result = muscleProgress(current, []);
    expect(result).toEqual([]);
  });

  it('usa el mejor set de cada semana, no el promedio', () => {
    const current = [
      { muscle: 'Pecho', weight: 60, reps: 8 },
      { muscle: 'Pecho', weight: 80, reps: 4 },
    ];
    const previous = [{ muscle: 'Pecho', weight: 70, reps: 6 }];
    const result = muscleProgress(current, previous);
    expect(result[0].currentBest).toBeCloseTo(estimateOneRepMax(80, 4), 5);
  });
});

describe('duración por ejercicio', () => {
  const performedSet = (exerciseId: string, secondsAfterStart: number): PerformedSet => ({
    id: `${exerciseId}-${secondsAfterStart}`, sessionId: 's1', exerciseId, exerciseName: exerciseId,
    setNumber: 1, weight: 20, reps: 10,
    completedAt: new Date(2026, 0, 1, 10, 0, secondsAfterStart).toISOString(),
  });

  it('reparte el tiempo entre el inicio y cada serie según su hora', () => {
    const startedAt = new Date(2026, 0, 1, 10, 0, 0).toISOString();
    const sets = [performedSet('a', 60), performedSet('a', 90), performedSet('b', 150)];
    const durations = exerciseDurationsMs(startedAt, sets);
    expect(durations.a).toBe(90 * 1000);
    expect(durations.b).toBe(60 * 1000);
  });

  it('la suma total coincide con el tiempo entre el inicio y la última serie', () => {
    const startedAt = new Date(2026, 0, 1, 10, 0, 0).toISOString();
    const sets = [performedSet('a', 40), performedSet('b', 100), performedSet('a', 130)];
    const durations = exerciseDurationsMs(startedAt, sets);
    const total = Object.values(durations).reduce((sum, value) => sum + value, 0);
    expect(total).toBe(130 * 1000);
  });

  it('no depende del orden en que vengan las series', () => {
    const startedAt = new Date(2026, 0, 1, 10, 0, 0).toISOString();
    const inOrder = exerciseDurationsMs(startedAt, [performedSet('a', 60), performedSet('b', 120)]);
    const reversed = exerciseDurationsMs(startedAt, [performedSet('b', 120), performedSet('a', 60)]);
    expect(reversed).toEqual(inOrder);
  });
});

describe('racha de entrenamiento', () => {
  const completedOn = (daysAgo: number, now: Date): WorkoutSession => {
    const date = new Date(now); date.setDate(date.getDate() - daysAgo);
    const iso = date.toISOString();
    return { id: `s-${daysAgo}`, routineId: 'r', routineName: 'r', startedAt: iso, completedAt: iso, status: 'completed', isQuick: false, sets: [] };
  };

  it('cuenta días consecutivos terminando hoy', () => {
    const now = new Date(2026, 0, 10, 18, 0, 0);
    const sessions = [completedOn(0, now), completedOn(1, now), completedOn(2, now)];
    expect(trainingStreak(sessions, now)).toBe(3);
  });

  it('no rompe la racha si hoy todavía no se entrenó', () => {
    const now = new Date(2026, 0, 10, 8, 0, 0);
    const sessions = [completedOn(1, now), completedOn(2, now)];
    expect(trainingStreak(sessions, now)).toBe(2);
  });

  it('se corta en el primer día sin sesión', () => {
    const now = new Date(2026, 0, 10, 18, 0, 0);
    const sessions = [completedOn(0, now), completedOn(1, now), completedOn(3, now)];
    expect(trainingStreak(sessions, now)).toBe(2);
  });

  it('es 0 sin historial', () => {
    expect(trainingStreak([], new Date())).toBe(0);
  });
});
