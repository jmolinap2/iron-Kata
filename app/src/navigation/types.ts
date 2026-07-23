export type RootStackParamList = {
  MainTabs: undefined;
  RoutineDetail: { routineId?: string } | undefined;
  ActiveExercise: undefined;
  WorkoutSummary: undefined;
  RoutineEditor: { routineId?: string } | undefined;
  QuickWorkout: undefined;
  Backup: undefined;
  SessionDetail: { sessionId: string };
};

export type MainTabsParamList = {
  Inicio: undefined;
  Entreno: undefined;
  Progreso: undefined;
  Nutrición: undefined;
  Perfil: undefined;
};
