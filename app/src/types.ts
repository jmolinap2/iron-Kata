export type MuscleGroup =
  | 'Espalda'
  | 'Bíceps'
  | 'Pecho'
  | 'Tríceps'
  | 'Piernas'
  | 'Hombros'
  | 'Pantorrillas'
  | 'Glúteos'
  | 'Abdomen'
  | 'Antebrazos'
  | 'Trapecios'
  | 'Descanso';

export type WeightUnit = 'kg' | 'lb';

export const APP_THEMES = ['Lima', 'Esmeralda', 'Cobalto', 'Ámbar'] as const;
export type AppTheme = typeof APP_THEMES[number];

export function normalizeAppTheme(value: unknown): AppTheme {
  return APP_THEMES.includes(value as AppTheme) ? value as AppTheme : 'Lima';
}

export function resolveVisibleTheme(savedTheme: AppTheme, previewTheme: AppTheme | null): AppTheme {
  return previewTheme ?? savedTheme;
}

// "Tema" (arriba) es el acento de color. "Estilo" es el lenguaje visual —
// independiente entre sí, se combinan (ej. Bento + Cobalto).
export const APP_STYLES = ['Oscuro', 'Bento', 'Vidrio'] as const;
export type AppStyle = typeof APP_STYLES[number];

export function normalizeAppStyle(value: unknown): AppStyle {
  return APP_STYLES.includes(value as AppStyle) ? value as AppStyle : 'Oscuro';
}

export function resolveVisibleStyle(savedStyle: AppStyle, previewStyle: AppStyle | null): AppStyle {
  return previewStyle ?? savedStyle;
}

export type Exercise = {
  id: string;
  name: string;
  muscle: MuscleGroup;
  mediaKey: string;
  instructions: string[];
};

export type PlannedExercise = Exercise & {
  routineId: string;
  position: number;
  sets: number;
  repMin: number;
  repMax: number;
  restSeconds: number;
  lastWeight: number | null;
};

export type Routine = {
  id: string;
  name: string;
  orderIndex: number;
  muscles: MuscleGroup[];
  isRest: boolean;
  active: boolean;
  exercises: PlannedExercise[];
};

export type PerformedSet = {
  id: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  completedAt: string;
};

export type WorkoutSession = {
  id: string;
  routineId: string;
  routineName: string;
  startedAt: string;
  completedAt: string | null;
  status: 'active' | 'completed' | 'cancelled';
  isQuick: boolean;
  sets: PerformedSet[];
};

export type BodyWeight = { id: string; date: string; weight: number };

export type FoodEntry = {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
};

export type PersonalRecord = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
  achievedAt: string;
};

export type ProfileGoal = 'Ganar fuerza y masa muscular' | 'Perder grasa' | 'Mantenimiento' | 'Resistencia';

export type Profile = {
  name: string;
  onboarded: boolean;
  lastSeenChangelog: number;
  sex: 'Hombre' | 'Mujer';
  goal: ProfileGoal;
  experience: 'Principiante' | 'Intermedio' | 'Avanzado';
  availableDays: number;
  durationMinutes: number;
  unit: WeightUnit;
  theme: AppTheme;
  style: AppStyle;
  calorieTarget: number;
  proteinTarget: number;
};

export type ActiveWorkout = {
  sessionId: string;
  routine: Routine;
  exerciseIndex: number;
  completedSets: Record<string, PerformedSet[]>;
  restEndsAt: number | null;
};

export type AppSnapshot = {
  profile: Profile;
  routines: Routine[];
  exercises: Exercise[];
  sessions: WorkoutSession[];
  weights: BodyWeight[];
  foods: FoodEntry[];
  records: PersonalRecord[];
};
