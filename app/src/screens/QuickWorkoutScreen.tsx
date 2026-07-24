import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, Screen } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { useAppStore } from '../store/useAppStore';
import { createThemedStyleSheet, spacing, useTheme } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function QuickWorkoutScreen() {
  const navigation = useNavigation<Navigation>();
  const colors = useTheme();
  const styles = useStyles();
  const allRoutines = useAppStore(state => state.routines);
  const routines = useMemo(() => allRoutines.filter(item => !item.isRest), [allRoutines]);
  const startRoutine = useAppStore(state => state.startRoutine);
  const active = useAppStore(state => state.activeWorkout);

  const start = async (id: string) => { await startRoutine(id, true); navigation.replace('ActiveExercise'); };

  return <Screen><AppScrollView contentStyle={{ paddingTop: spacing.md }}>
    <View style={styles.topbar}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={25} color={colors.text} /></Pressable><View><Text style={styles.title}>Entrenamiento rápido</Text><Text style={styles.subtitle}>Tres ejercicios sin alterar tu secuencia.</Text></View></View>
    {active ? <ActionButton label="Continuar entrenamiento activo" icon="arrow-forward" onPress={() => navigation.replace('ActiveExercise')} /> : null}
    {routines.map((routine, index) => <Card key={routine.id} delay={index * 50}>
      <Text style={styles.routineName}>{routine.name}</Text><Text style={styles.meta}>Primeros {Math.min(3, routine.exercises.length)} ejercicios · registro completo</Text>
      <View style={styles.preview}>{routine.exercises.slice(0, 3).map(item => <View key={item.id} style={styles.previewItem}><ExerciseMedia mediaKey={item.mediaKey} style={styles.thumb}/><Text numberOfLines={1} style={styles.exercise}>{item.name}</Text></View>)}</View>
      <ActionButton label="Empezar rápido" icon="flash" onPress={() => { void start(routine.id); }} />
    </Card>)}
  </AppScrollView></Screen>;
}

const useStyles = createThemedStyleSheet(colors => ({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 86 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 27, fontWeight: '900' }, subtitle: { color: colors.textMuted, marginTop: 3 },
  routineName: { color: colors.text, fontSize: 20, fontWeight: '900' }, meta: { color: colors.textMuted, fontSize: 12, marginTop: 3 }, preview: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg }, previewItem: { flex: 1 }, thumb: { width: '100%', aspectRatio: 1.35 }, exercise: { color: colors.text, fontSize: 10, fontWeight: '700', marginTop: 5 },
}));
