import { create } from 'zustand';

import {
  completeSession,
  createSession,
  exportBackup,
  importBackup,
  initializeDatabase,
  loadSnapshot,
  replaceRoutine,
  saveBodyWeight,
  saveFood,
  savePerformedSet,
  savePersonalRecord,
  saveProfile,
} from '../data/database';
import type {
  ActiveWorkout,
  AppSnapshot,
  BodyWeight,
  FoodEntry,
  PerformedSet,
  PersonalRecord,
  Profile,
  Routine,
  WorkoutSession,
} from '../types';
import { estimateOneRepMax, isNewRecord, nextRoutine } from '../domain/rules';

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const EMPTY_SNAPSHOT: AppSnapshot = {
  profile: {
    name: 'Atleta', goal: 'Ganar fuerza y masa muscular', experience: 'Principiante', availableDays: 3,
    durationMinutes: 60, unit: 'kg', theme: 'Lima', calorieTarget: 2300, proteinTarget: 180,
  },
  routines: [], sessions: [], weights: [], foods: [], records: [],
};

type WorkoutSummary = { session: WorkoutSession; newRecords: PersonalRecord[] };

type AppStore = AppSnapshot & {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  activeWorkout: ActiveWorkout | null;
  lastSummary: WorkoutSummary | null;
  initialize: () => Promise<void>;
  reload: () => Promise<void>;
  startRoutine: (routineId: string, quick?: boolean) => Promise<void>;
  completeRest: (routineId: string) => Promise<void>;
  completeSet: (weight: number, reps: number) => Promise<PerformedSet>;
  nextExercise: () => void;
  previousExercise: () => void;
  stopRest: () => void;
  finishWorkout: () => Promise<WorkoutSummary>;
  updateProfile: (profile: Profile) => Promise<void>;
  addBodyWeight: (weight: number) => Promise<void>;
  addFood: (name: string, calories: number, protein: number) => Promise<void>;
  saveRoutine: (routine: Routine) => Promise<void>;
  createBackup: () => Promise<string>;
  restoreBackup: (raw: string) => Promise<void>;
  clearSummary: () => void;
};

const rebuildActiveWorkout = (snapshot: AppSnapshot): ActiveWorkout | null => {
  const activeSession = snapshot.sessions.find(item => item.status === 'active');
  if (!activeSession) return null;
  const sourceRoutine = snapshot.routines.find(item => item.id === activeSession.routineId);
  if (!sourceRoutine) return null;
  const routine = activeSession.isQuick
    ? { ...sourceRoutine, id: `${sourceRoutine.id}-quick`, name: activeSession.routineName, exercises: sourceRoutine.exercises.slice(0, 3) }
    : sourceRoutine;
  const grouped: Record<string, PerformedSet[]> = {};
  for (const set of activeSession.sets) (grouped[set.exerciseId] ??= []).push(set);
  const firstIncomplete = routine.exercises.findIndex(item => (grouped[item.id]?.length ?? 0) < item.sets);
  return {
    sessionId: activeSession.id,
    routine,
    exerciseIndex: firstIncomplete < 0 ? Math.max(0, routine.exercises.length - 1) : firstIncomplete,
    completedSets: grouped,
    restEndsAt: null,
  };
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...EMPTY_SNAPSHOT,
  initialized: false,
  loading: false,
  error: null,
  activeWorkout: null,
  lastSummary: null,

  initialize: async () => {
    if (get().loading || get().initialized) return;
    set({ loading: true, error: null });
    try {
      await initializeDatabase();
      const snapshot = await loadSnapshot();
      set({ ...snapshot, activeWorkout: rebuildActiveWorkout(snapshot), initialized: true, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'No se pudo iniciar la aplicación.' });
    }
  },

  reload: async () => {
    const snapshot = await loadSnapshot();
    set({ ...snapshot, activeWorkout: get().activeWorkout ?? rebuildActiveWorkout(snapshot) });
  },

  startRoutine: async (routineId, quick = false) => {
    const source = get().routines.find(item => item.id === routineId);
    if (!source || source.isRest) return;
    const routine: Routine = quick
      ? { ...source, id: `${source.id}-quick`, name: `Rápido · ${source.name}`, exercises: source.exercises.slice(0, 3) }
      : source;
    const session: WorkoutSession = {
      id: makeId('session'),
      routineId: source.id,
      routineName: routine.name,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'active',
      isQuick: quick,
      sets: [],
    };
    await createSession(session);
    set({
      sessions: [session, ...get().sessions],
      activeWorkout: { sessionId: session.id, routine, exerciseIndex: 0, completedSets: {}, restEndsAt: null },
      lastSummary: null,
    });
  },

  completeRest: async routineId => {
    const routine = get().routines.find(item => item.id === routineId && item.isRest);
    if (!routine) return;
    const now = new Date().toISOString();
    const session: WorkoutSession = {
      id: makeId('rest'), routineId: routine.id, routineName: routine.name,
      startedAt: now, completedAt: now, status: 'completed', isQuick: false, sets: [],
    };
    await createSession({ ...session, completedAt: null, status: 'active' });
    await completeSession(session.id, now);
    set({ sessions: [session, ...get().sessions] });
  },

  completeSet: async (weight, reps) => {
    const active = get().activeWorkout;
    if (!active) throw new Error('No hay un entrenamiento activo.');
    const exercise = active.routine.exercises[active.exerciseIndex];
    const previous = active.completedSets[exercise.id] ?? [];
    const item: PerformedSet = {
      id: makeId('set'), sessionId: active.sessionId, exerciseId: exercise.id,
      exerciseName: exercise.name, setNumber: previous.length + 1,
      weight, reps, completedAt: new Date().toISOString(),
    };
    await savePerformedSet(item);

    const estimatedOneRepMax = estimateOneRepMax(weight, reps);
    const best = get().records.filter(record => record.exerciseId === exercise.id)
      .reduce((max, record) => Math.max(max, record.estimatedOneRepMax), 0);
    let records = get().records;
    let summaryRecords = get().lastSummary?.newRecords ?? [];
    if (isNewRecord(estimatedOneRepMax, best)) {
      const record: PersonalRecord = {
        id: makeId('record'), exerciseId: exercise.id, exerciseName: exercise.name,
        weight, reps, estimatedOneRepMax, achievedAt: item.completedAt,
      };
      await savePersonalRecord(record);
      records = [record, ...records];
      summaryRecords = [...summaryRecords.filter(entry => entry.exerciseId !== exercise.id), record];
    }

    const completedSets = { ...active.completedSets, [exercise.id]: [...previous, item] };
    set({
      records,
      activeWorkout: {
        ...active,
        completedSets,
        restEndsAt: Date.now() + exercise.restSeconds * 1000,
      },
      lastSummary: { session: get().sessions.find(s => s.id === active.sessionId)!, newRecords: summaryRecords },
    });
    return item;
  },

  nextExercise: () => {
    const active = get().activeWorkout;
    if (!active) return;
    set({ activeWorkout: { ...active, exerciseIndex: Math.min(active.exerciseIndex + 1, active.routine.exercises.length - 1), restEndsAt: null } });
  },

  previousExercise: () => {
    const active = get().activeWorkout;
    if (!active) return;
    set({ activeWorkout: { ...active, exerciseIndex: Math.max(active.exerciseIndex - 1, 0), restEndsAt: null } });
  },

  stopRest: () => {
    const active = get().activeWorkout;
    if (active) set({ activeWorkout: { ...active, restEndsAt: null } });
  },

  finishWorkout: async () => {
    const active = get().activeWorkout;
    if (!active) throw new Error('No hay entrenamiento activo.');
    const completedAt = new Date().toISOString();
    await completeSession(active.sessionId, completedAt);
    const allSets = Object.values(active.completedSets).flat();
    const current = get().sessions.find(item => item.id === active.sessionId)!;
    const session: WorkoutSession = { ...current, completedAt, status: 'completed', sets: allSets };
    const sessionRecords = get().records.filter(record => record.achievedAt >= current.startedAt);
    const summary = { session, newRecords: sessionRecords };
    const snapshot = await loadSnapshot();
    set({ ...snapshot, activeWorkout: null, lastSummary: summary });
    return summary;
  },

  updateProfile: async profile => {
    await saveProfile(profile);
    set({ profile });
  },

  addBodyWeight: async weight => {
    const entry: BodyWeight = { id: makeId('weight'), date: new Date().toISOString(), weight };
    await saveBodyWeight(entry);
    set({ weights: [entry, ...get().weights] });
  },

  addFood: async (name, calories, protein) => {
    const entry: FoodEntry = { id: makeId('food'), date: new Date().toISOString(), name, calories, protein };
    await saveFood(entry);
    set({ foods: [entry, ...get().foods] });
  },

  saveRoutine: async routine => {
    await replaceRoutine(routine);
    const snapshot = await loadSnapshot();
    set({ ...snapshot });
  },

  createBackup: exportBackup,
  restoreBackup: async raw => {
    await importBackup(raw);
    const snapshot = await loadSnapshot();
    set({ ...snapshot, activeWorkout: rebuildActiveWorkout(snapshot) });
  },
  clearSummary: () => set({ lastSummary: null }),
}));

export const selectRecommendedRoutine = (state: AppStore): Routine | null => {
  return nextRoutine(state.routines, state.sessions);
};

export const weekSessions = (sessions: WorkoutSession[]) => {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  return sessions.filter(item => item.status === 'completed' && new Date(item.completedAt ?? item.startedAt) >= since);
};
