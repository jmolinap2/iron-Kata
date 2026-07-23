import * as SQLite from 'expo-sqlite';

import { DEFAULT_PROFILE, SEED_EXERCISES, SEED_ROUTINES } from './seed';
import type {
  AppSnapshot,
  BodyWeight,
  FoodEntry,
  PerformedSet,
  PersonalRecord,
  Profile,
  Routine,
  WorkoutSession,
} from '../types';

const DATABASE_NAME = 'iron-kata.db';
const DATABASE_VERSION = 1;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDatabase = () => {
  databasePromise ??= SQLite.openDatabaseAsync(DATABASE_NAME);
  return databasePromise;
};

export async function initializeDatabase() {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1), name TEXT NOT NULL, goal TEXT NOT NULL,
      experience TEXT NOT NULL, available_days INTEGER NOT NULL, duration_minutes INTEGER NOT NULL,
      unit TEXT NOT NULL, theme TEXT NOT NULL, calorie_target INTEGER NOT NULL, protein_target INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, order_index INTEGER NOT NULL,
      muscles_json TEXT NOT NULL, is_rest INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, muscle TEXT NOT NULL,
      media_key TEXT NOT NULL, instructions_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS routine_exercises (
      routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id), position INTEGER NOT NULL,
      sets INTEGER NOT NULL, rep_min INTEGER NOT NULL, rep_max INTEGER NOT NULL, rest_seconds INTEGER NOT NULL,
      PRIMARY KEY (routine_id, exercise_id)
    );
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY NOT NULL, routine_id TEXT NOT NULL, routine_name TEXT NOT NULL,
      started_at TEXT NOT NULL, completed_at TEXT, status TEXT NOT NULL, is_quick INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS performed_sets (
      id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL, exercise_name TEXT NOT NULL, set_number INTEGER NOT NULL,
      weight REAL NOT NULL, reps INTEGER NOT NULL, completed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS body_weights (
      id TEXT PRIMARY KEY NOT NULL, date TEXT NOT NULL, weight REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY NOT NULL, date TEXT NOT NULL, name TEXT NOT NULL,
      calories INTEGER NOT NULL, protein REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY NOT NULL, exercise_id TEXT NOT NULL, exercise_name TEXT NOT NULL,
      weight REAL NOT NULL, reps INTEGER NOT NULL, estimated_one_rep_max REAL NOT NULL, achieved_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_completed ON workout_sessions(completed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sets_session ON performed_sets(session_id);
    CREATE INDEX IF NOT EXISTS idx_weights_date ON body_weights(date DESC);
  `);

  const version = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_meta WHERE key = 'schema_version'");
  if (!version) {
    await seedDatabase(db);
    await db.runAsync("INSERT INTO app_meta(key, value) VALUES ('schema_version', ?)", String(DATABASE_VERSION));
  }
}

async function seedDatabase(db: SQLite.SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR IGNORE INTO profile
       (id, name, goal, experience, available_days, duration_minutes, unit, theme, calorie_target, protein_target)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      DEFAULT_PROFILE.name,
      DEFAULT_PROFILE.goal,
      DEFAULT_PROFILE.experience,
      DEFAULT_PROFILE.availableDays,
      DEFAULT_PROFILE.durationMinutes,
      DEFAULT_PROFILE.unit,
      DEFAULT_PROFILE.theme,
      DEFAULT_PROFILE.calorieTarget,
      DEFAULT_PROFILE.proteinTarget,
    );

    for (const item of SEED_EXERCISES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO exercises(id, name, muscle, media_key, instructions_json)
         VALUES (?, ?, ?, ?, ?)`,
        item.id,
        item.name,
        item.muscle,
        item.mediaKey,
        JSON.stringify(item.instructions),
      );
    }

    for (const routine of SEED_ROUTINES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO routines(id, name, order_index, muscles_json, is_rest, active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        routine.id,
        routine.name,
        routine.orderIndex,
        JSON.stringify(routine.muscles),
        routine.isRest ? 1 : 0,
      );
      for (const item of routine.exercises) {
        await db.runAsync(
          `INSERT OR IGNORE INTO routine_exercises
           (routine_id, exercise_id, position, sets, rep_min, rep_max, rest_seconds)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          routine.id,
          item.id,
          item.position,
          item.sets,
          item.repMin,
          item.repMax,
          item.restSeconds,
        );
      }
    }
  });
}

type RoutineRow = {
  id: string; name: string; order_index: number; muscles_json: string; is_rest: number; active: number;
};
type ExerciseRow = {
  routine_id: string; position: number; sets: number; rep_min: number; rep_max: number; rest_seconds: number;
  id: string; name: string; muscle: string; media_key: string; instructions_json: string; last_weight: number | null;
};

export async function loadSnapshot(): Promise<AppSnapshot> {
  const db = await getDatabase();
  const profileRow = await db.getFirstAsync<any>('SELECT * FROM profile WHERE id = 1');
  const routineRows = await db.getAllAsync<RoutineRow>('SELECT * FROM routines WHERE active = 1 ORDER BY order_index');
  const exerciseRows = await db.getAllAsync<ExerciseRow>(`
    SELECT re.routine_id, re.position, re.sets, re.rep_min, re.rep_max, re.rest_seconds,
           e.id, e.name, e.muscle, e.media_key, e.instructions_json,
           (SELECT ps.weight FROM performed_sets ps
            JOIN workout_sessions ws ON ws.id = ps.session_id
            WHERE ps.exercise_id = e.id AND ws.status = 'completed'
            ORDER BY ps.completed_at DESC LIMIT 1) AS last_weight
    FROM routine_exercises re JOIN exercises e ON e.id = re.exercise_id
    ORDER BY re.routine_id, re.position
  `);
  const setRows = await db.getAllAsync<any>('SELECT * FROM performed_sets ORDER BY completed_at');
  const sessionRows = await db.getAllAsync<any>('SELECT * FROM workout_sessions ORDER BY started_at DESC LIMIT 90');

  const routines: Routine[] = routineRows.map(row => ({
    id: row.id,
    name: row.name,
    orderIndex: row.order_index,
    muscles: JSON.parse(row.muscles_json),
    isRest: row.is_rest === 1,
    active: row.active === 1,
    exercises: exerciseRows.filter(item => item.routine_id === row.id).map(item => ({
      id: item.id,
      name: item.name,
      muscle: item.muscle as any,
      mediaKey: item.media_key,
      instructions: JSON.parse(item.instructions_json),
      routineId: item.routine_id,
      position: item.position,
      sets: item.sets,
      repMin: item.rep_min,
      repMax: item.rep_max,
      restSeconds: item.rest_seconds,
      lastWeight: item.last_weight,
    })),
  }));

  const sets: PerformedSet[] = setRows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    setNumber: row.set_number,
    weight: row.weight,
    reps: row.reps,
    completedAt: row.completed_at,
  }));
  const sessions: WorkoutSession[] = sessionRows.map(row => ({
    id: row.id,
    routineId: row.routine_id,
    routineName: row.routine_name,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    isQuick: row.is_quick === 1,
    sets: sets.filter(item => item.sessionId === row.id),
  }));

  const weights = await db.getAllAsync<any>('SELECT * FROM body_weights ORDER BY date DESC LIMIT 30');
  const foods = await db.getAllAsync<any>('SELECT * FROM foods ORDER BY date DESC LIMIT 100');
  const records = await db.getAllAsync<any>('SELECT * FROM personal_records ORDER BY achieved_at DESC LIMIT 50');

  return {
    profile: {
      name: profileRow.name,
      goal: profileRow.goal,
      experience: profileRow.experience,
      availableDays: profileRow.available_days,
      durationMinutes: profileRow.duration_minutes,
      unit: profileRow.unit,
      theme: profileRow.theme,
      calorieTarget: profileRow.calorie_target,
      proteinTarget: profileRow.protein_target,
    },
    routines,
    sessions,
    weights: weights.map(row => ({ id: row.id, date: row.date, weight: row.weight })),
    foods: foods.map(row => ({ id: row.id, date: row.date, name: row.name, calories: row.calories, protein: row.protein })),
    records: records.map(row => ({
      id: row.id,
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      weight: row.weight,
      reps: row.reps,
      estimatedOneRepMax: row.estimated_one_rep_max,
      achievedAt: row.achieved_at,
    })),
  };
}

export async function saveProfile(profile: Profile) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE profile SET name=?, goal=?, experience=?, available_days=?, duration_minutes=?,
     unit=?, theme=?, calorie_target=?, protein_target=? WHERE id=1`,
    profile.name, profile.goal, profile.experience, profile.availableDays, profile.durationMinutes,
    profile.unit, profile.theme, profile.calorieTarget, profile.proteinTarget,
  );
}

export async function createSession(session: WorkoutSession) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO workout_sessions(id, routine_id, routine_name, started_at, completed_at, status, is_quick)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    session.id, session.routineId, session.routineName, session.startedAt, session.completedAt,
    session.status, session.isQuick ? 1 : 0,
  );
}

export async function savePerformedSet(item: PerformedSet) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO performed_sets(id, session_id, exercise_id, exercise_name, set_number, weight, reps, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id, item.sessionId, item.exerciseId, item.exerciseName, item.setNumber,
    item.weight, item.reps, item.completedAt,
  );
}

export async function completeSession(sessionId: string, completedAt: string) {
  const db = await getDatabase();
  await db.runAsync("UPDATE workout_sessions SET status='completed', completed_at=? WHERE id=?", completedAt, sessionId);
}

export async function saveBodyWeight(entry: BodyWeight) {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO body_weights(id, date, weight) VALUES (?, ?, ?)', entry.id, entry.date, entry.weight);
}

export async function saveFood(entry: FoodEntry) {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO foods(id, date, name, calories, protein) VALUES (?, ?, ?, ?, ?)', entry.id, entry.date, entry.name, entry.calories, entry.protein);
}

export async function savePersonalRecord(record: PersonalRecord) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO personal_records(id, exercise_id, exercise_name, weight, reps, estimated_one_rep_max, achieved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    record.id, record.exerciseId, record.exerciseName, record.weight, record.reps,
    record.estimatedOneRepMax, record.achievedAt,
  );
}

const BACKUP_TABLES = [
  'profile', 'routines', 'exercises', 'routine_exercises', 'workout_sessions',
  'performed_sets', 'body_weights', 'foods', 'personal_records',
] as const;

export async function exportBackup() {
  const db = await getDatabase();
  const data: Record<string, unknown[]> = {};
  for (const table of BACKUP_TABLES) data[table] = await db.getAllAsync(`SELECT * FROM ${table}`);
  return JSON.stringify({ format: 'iron-kata-backup', version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

export async function importBackup(raw: string) {
  const parsed = JSON.parse(raw);
  if (parsed?.format !== 'iron-kata-backup' || parsed?.version !== 1 || !parsed?.data) {
    throw new Error('El archivo no es un respaldo válido de Iron Kata.');
  }
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    for (const table of [...BACKUP_TABLES].reverse()) await db.runAsync(`DELETE FROM ${table}`);
    for (const table of BACKUP_TABLES) {
      const rows = parsed.data[table];
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        const keys = Object.keys(row);
        const placeholders = keys.map(() => '?').join(',');
        await db.runAsync(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`, ...keys.map(key => row[key]));
      }
    }
    await db.execAsync('PRAGMA foreign_keys = ON;');
  });
}

export async function replaceRoutine(routine: Routine) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO routines(id, name, order_index, muscles_json, is_rest, active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      routine.id, routine.name, routine.orderIndex, JSON.stringify(routine.muscles), routine.isRest ? 1 : 0, routine.active ? 1 : 0,
    );
    await db.runAsync('DELETE FROM routine_exercises WHERE routine_id=?', routine.id);
    for (const item of routine.exercises) {
      await db.runAsync(
        `INSERT INTO routine_exercises(routine_id, exercise_id, position, sets, rep_min, rep_max, rest_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        routine.id, item.id, item.position, item.sets, item.repMin, item.repMax, item.restSeconds,
      );
    }
  });
}
