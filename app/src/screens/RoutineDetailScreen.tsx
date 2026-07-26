import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight } from 'react-native-reanimated';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, ProgressBar, Screen } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { selectRecommendedRoutine, useAppStore } from '../store/useAppStore';
import { exerciseDurationsMs, trainingStreak } from '../domain/rules';
import { createThemedStyleSheet, radius, shadow, spacing, useTheme } from '../theme';
import { formatWeight, isSameDay } from '../utils/format';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function RoutineDetailScreen() {
  const navigation = useNavigation<Navigation>();
  const colors = useTheme();
  const styles = useStyles();
  const route = useRoute<RouteProp<RootStackParamList, 'RoutineDetail'>>();
  const routines = useAppStore(state => state.routines);
  const recommended = useAppStore(selectRecommendedRoutine);
  const active = useAppStore(state => state.activeWorkout);
  const sessions = useAppStore(state => state.sessions);
  const startRoutine = useAppStore(state => state.startRoutine);
  const routine = useMemo(() => routines.find(item => item.id === route.params?.routineId) ?? recommended, [recommended, route.params?.routineId, routines]);
  const [expanded, setExpanded] = useState(0);
  const [timeOpen, setTimeOpen] = useState(false);

  if (!routine) return null;
  const completed = active?.routine.id === routine.id ? Object.values(active.completedSets).flat().length : 0;
  const total = routine.exercises.reduce((sum, item) => sum + item.sets, 0);

  const begin = async (startIndex = 0) => {
    if (active) { navigation.navigate('ActiveExercise'); return; }
    await startRoutine(routine.id, false, startIndex);
    navigation.replace('ActiveExercise');
  };

  const todaySessions = sessions.filter(item => isSameDay(item.startedAt, new Date()));
  const totalTodayMs = todaySessions.reduce((sum, item) => {
    const end = active?.sessionId === item.id ? Date.now() : new Date(item.completedAt ?? item.startedAt).getTime();
    return sum + Math.max(0, end - new Date(item.startedAt).getTime());
  }, 0);
  const routineSessionToday = todaySessions.find(item => item.routineId === routine.id);
  const routineSets = routineSessionToday
    ? (active?.sessionId === routineSessionToday.id ? Object.values(active.completedSets).flat() : routineSessionToday.sets)
    : [];
  const exerciseMs = routineSessionToday ? exerciseDurationsMs(routineSessionToday.startedAt, routineSets) : {};
  const streak = trainingStreak(sessions);

  return (
    <Screen>
      <AppScrollView contentStyle={{ paddingTop: spacing.md }}>
        <View style={styles.topbar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}><Ionicons name="arrow-back" size={25} color={colors.text} /></Pressable>
          <View style={{ flex: 1 }}><Text style={styles.title}>Rutina de hoy</Text><Text style={styles.subtitle}>{routine.name}</Text></View>
          <View style={styles.streak}><Ionicons name="flame" color={colors.primary} size={19} /><Text style={styles.streakText}>{streak}</Text></View>
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
                  {!active ? <Pressable style={styles.startHere} onPress={() => { void begin(index); }}><Ionicons name="play-circle-outline" size={18} color={colors.primary} /><Text style={styles.startHereText}>Comenzar desde aquí</Text></Pressable> : null}
                </View>
              ) : null}
            </Card>
          );
        })}
        <ActionButton label={active ? 'Continuar entrenamiento' : 'Empezar primer ejercicio'} icon="play" onPress={() => { void begin(); }} />
      </AppScrollView>

      <Pressable style={styles.timeTab} onPress={() => setTimeOpen(value => !value)}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={styles.timeTabText}>{formatMinutes(totalTodayMs)}</Text>
      </Pressable>

      {timeOpen ? (
        <>
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.timeBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setTimeOpen(false)} />
          </Animated.View>
          <Animated.View entering={SlideInRight.duration(240)} exiting={SlideOutRight.duration(200)} style={styles.timePanel}>
            <Text style={styles.timePanelTitle}>Tiempo de hoy</Text>
            <Text style={styles.timePanelTotal}>{formatMinutes(totalTodayMs)}</Text>
            <Text style={styles.timePanelSubtitle}>{routine.name}</Text>
            <View style={styles.timeList}>
              {routine.exercises.map(item => (
                <View key={item.id} style={styles.timeRow}>
                  <Text style={styles.timeRowName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.timeRowValue}>{formatMinutes(exerciseMs[item.id] ?? 0)}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </>
      ) : null}
    </Screen>
  );
}

function formatMinutes(ms: number) {
  return `${Math.round(ms / 60000)} min`;
}

function Metric({ value, label, icon }: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap }) {
  const colors = useTheme();
  const styles = useStyles();
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><View style={styles.metricLabelRow}><Ionicons name={icon} size={15} color={colors.primary} /><Text style={styles.metricLabel}>{label}</Text></View></View>;
}

const useStyles = createThemedStyleSheet(colors => ({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 80 },
  iconButton: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: colors.textMuted, fontSize: 16, marginTop: 2 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 },
  streakText: { color: colors.text, fontWeight: '800' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
  progressGreen: { color: colors.success, fontWeight: '700' },
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
  startHere: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primaryBorder, backgroundColor: colors.primarySoftBackground },
  startHereText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  timeTab: { position: 'absolute', right: 0, top: '42%', flexDirection: 'column', alignItems: 'center', gap: 3, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRightWidth: 0, borderTopLeftRadius: radius.md, borderBottomLeftRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, ...shadow },
  timeTabText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  timeBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2,3,4,0.55)' },
  timePanel: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '78%', maxWidth: 320, backgroundColor: colors.surface, borderLeftWidth: 1, borderColor: colors.border, padding: spacing.xl, paddingTop: spacing.huge },
  timePanelTitle: { color: colors.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  timePanelTotal: { color: colors.text, fontSize: 34, fontWeight: '900', marginTop: spacing.xs },
  timePanelSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 3, marginBottom: spacing.lg },
  timeList: { gap: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 42, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft, gap: spacing.md },
  timeRowName: { color: colors.text, fontSize: 13, fontWeight: '600', flex: 1 },
  timeRowValue: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
}));
