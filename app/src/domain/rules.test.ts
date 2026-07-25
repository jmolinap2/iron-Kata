import { describe, expect, it } from 'vitest';

import { estimateOneRepMax, isNewRecord, muscleProgress, nextRoutine } from './rules';
import type { Routine, WorkoutSession } from '../types';

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
