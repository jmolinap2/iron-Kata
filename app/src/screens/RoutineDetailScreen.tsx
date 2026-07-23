import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, ProgressBar, Screen } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { selectRecommendedRoutine, useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme';
import { formatWeight } from '../utils/format';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function RoutineDetailScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteProp<RootStackParamList, 'RoutineDetail'>>();
  const routines = useAppStore(state => state.routines);
  const recommended = useAppStore(selectRecommendedRoutine);
  const active = useAppStore(state => state.activeWorkout);
  const startRoutine = useAppStore(state => state.startRoutine);
  const routine = useMemo(() => routines.find(item => item.id === route.params?.routineId) ?? recommended, [recommended, route.params?.routineId, routines]);
  const [expanded, setExpanded] = useState(0);

  if (!routine) return null;
  const completed = active?.routine.id === routine.id ? Object.values(active.completedSets).flat().length : 0;
  const total = routine.exercises.reduce((sum, item) => sum + item.sets, 0);

  const begin = async () => {
    if (active) { navigation.navigate('ActiveExercise'); return; }
    await startRoutine(routine.id);
    navigation.replace('ActiveExercise');
  };

  return (
    <Screen>
      <AppScrollView contentStyle={{ paddingTop: spacing.md }}>
        <View style={styles.topbar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}><Ionicons name="arrow-back" size={25} color={colors.text} /></Pressable>
          <View style={{ flex: 1 }}><Text style={styles.title}>Rutina de hoy</Text><Text style={styles.subtitle}>{routine.name}</Text></View>
          <View style={styles.streak}><Ionicons name="flame" color={colors.primary} size={19} /><Text style={styles.streakText}>12</Text></View>
        </View>
        <ProgressBar progress={total ? completed / total : 0} />
        <View style={styles.progressLabels}><Text style={styles.progressGreen}>{completed} de {total} series</Text><Text style={styles.progressMuted}>{total ? Math.round(completed / total * 100) : 0}% completado</Text></View>

        {routine.exercises.map((item, index) => {
          const isOpen = expanded === index;
          return (
            <Card key={item.id} style={[styles.exerciseCard, isOpen && styles.exerciseCardOpen]} delay={index * 45}>
              <Pressable style={styles.exerciseHeader} onPress={() => setExpanded(isOpen ? -1 : index)}>
                <View style={styles.order}><Text style={styles.orderText}>{index + 1}</Text></View>
                <ExerciseMedia mediaKey={item.mediaKey} style={styles.thumb} />
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={24} color={isOpen ? colors.primary : colors.textDim} />
              </Pressable>
              {isOpen ? (
                <View style={styles.details}>
                  <View style={styles.metrics}>
                    <Metric value={String(item.sets)} label="Series" icon="layers-outline" />
                    <Metric value={`${item.repMin}–${item.repMax}`} label="Repeticiones" icon="sync-outline" />
                    <Metric value={`${item.restSeconds} s`} label="Descanso" icon="time-outline" />
                  </View>
                  <View style={styles.loadRow}>
                    <View><Text style={styles.loadLabel}>Último peso</Text><Text style={styles.loadValue}>{item.lastWeight == null ? 'Sin registro' : `${formatWeight(item.lastWeight)} kg`}</Text></View>
                    <View><Text style={styles.loadLabel}>Objetivo</Text><Text style={[styles.loadValue, { color: colors.primary }]}>{item.lastWeight == null ? 'Registra tu base' : `${formatWeight(item.lastWeight + 2.5)} kg`}</Text></View>
                  </View>
                  <View style={styles.instruction}><Ionicons name="information-circle-outline" size={18} color={colors.primary} /><Text style={styles.instructionText}>{item.instructions[0]}</Text></View>
                </View>
              ) : null}
            </Card>
          );
        })}
        <ActionButton label={active ? 'Continuar entrenamiento' : 'Empezar primer ejercicio'} icon="play" onPress={() => { void begin(); }} />
      </AppScrollView>
    </Screen>
  );
}

function Metric({ value, label, icon }: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><View style={styles.metricLabelRow}><Ionicons name={icon} size={15} color={colors.primary} /><Text style={styles.metricLabel}>{label}</Text></View></View>;
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 80 },
  iconButton: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: colors.textMuted, fontSize: 16, marginTop: 2 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 },
  streakText: { color: colors.text, fontWeight: '800' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
  progressGreen: { color: colors.primary, fontWeight: '700' },
  progressMuted: { color: colors.textMuted },
  exerciseCard: { padding: spacing.md },
  exerciseCardOpen: { borderColor: colors.primary },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  order: { width: 39, height: 39, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  orderText: { color: colors.primary, fontWeight: '900', fontSize: 16 },
  thumb: { width: 90, height: 64 },
  exerciseName: { color: colors.text, fontSize: 17, fontWeight: '800', flex: 1 },
  details: { marginTop: spacing.lg, gap: spacing.md },
  metrics: { flexDirection: 'row', backgroundColor: colors.backgroundSoft, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.lg },
  metric: { flex: 1, alignItems: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
  metricValue: { color: colors.text, fontWeight: '800', fontSize: 19 },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  metricLabel: { color: colors.textMuted, fontSize: 11 },
  loadRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.backgroundSoft, borderRadius: radius.md, padding: spacing.lg },
  loadLabel: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  loadValue: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  instruction: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  instructionText: { color: colors.textMuted, fontSize: 12, flex: 1 },
});
