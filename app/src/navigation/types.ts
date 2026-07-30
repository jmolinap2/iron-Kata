export type RootStackParamList = {
  MainTabs: undefined;
  RoutineDetail: { routineId?: string } | undefined;
  ActiveExercise: undefined;
  WorkoutSummary: undefined;
  RoutineEditor: { routineId?: string } | undefined;
  QuickWorkout: undefined;
  Backup: undefined;
  SessionDetail: { sessionId: string };
  LogPastWorkout: { routineId?: string; daysAgo?: number } | undefined;
  HowItWorks: undefined;
};

export type MainTabsParamList = {
  Inicio: undefined;
  Entreno: undefined;
  Progreso: undefined;
  Nutrición: undefined;
  Perfil: undefined;
};
