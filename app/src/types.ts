export type MuscleGroup =
  | 'Espalda'
  | 'Bíceps'
  | 'Pecho'
  | 'Tríceps'
  | 'Piernas'
  | 'Hombros'
  | 'Descanso';

export type WeightUnit = 'kg' | 'lb';

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

export type Profile = {
  name: string;
  goal: string;
  experience: 'Principiante' | 'Intermedio' | 'Avanzado';
  availableDays: number;
  durationMinutes: number;
  unit: WeightUnit;
  theme: 'Oscuro';
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
  sessions: WorkoutSession[];
  weights: BodyWeight[];
  foods: FoodEntry[];
  records: PersonalRecord[];
};
