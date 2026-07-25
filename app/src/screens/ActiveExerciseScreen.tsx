import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, ProgressBar, Screen, SectionTitle } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { useAppStore } from '../store/useAppStore';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';
import { formatDuration, formatWeight } from '../utils/format';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ActiveExerciseScreen() {
  const colors = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<Navigation>();
  const active = useAppStore(state => state.activeWorkout);
  const completeSet = useAppStore(state => state.completeSet);
  const nextExercise = useAppStore(state => state.nextExercise);
  const previousExercise = useAppStore(state => state.previousExercise);
  const stopRest = useAppStore(state => state.stopRest);
  const finishWorkout = useAppStore(state => state.finishWorkout);
  const [now, setNow] = useState(Date.now());
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(10);
  const [saving, setSaving] = useState(false);

  const exercise = active?.routine.exercises[active.exerciseIndex];
  const completed = exercise && active ? active.completedSets[exercise.id] ?? [] : [];
  const restRemaining = active?.restEndsAt ? Math.max(0, Math.ceil((active.restEndsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!exercise) return;
    const previousWeight = completed.at(-1)?.weight ?? exercise.lastWeight ?? 0;
    const previousReps = completed.at(-1)?.reps ?? exercise.repMin;
    setWeight(previousWeight);
    setReps(previousReps);
  }, [exercise?.id]);

  useEffect(() => {
    if (!active?.restEndsAt) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [active?.restEndsAt]);

  const totalSets = useMemo(() => active?.routine.exercises.reduce((sum, item) => sum + item.sets, 0) ?? 0, [active?.routine]);
  const completedTotal = active ? Object.values(active.completedSets).flat().length : 0;

  if (!active || !exercise) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.emptyTitle}>No hay un ejercicio activo</Text>
        <ActionButton label="Volver al inicio" icon="home" onPress={() => navigation.replace('MainTabs')} />
      </Screen>
    );
  }

  const recordSet = async () => {
    if (completed.length >= exercise.sets) return;
    setSaving(true);
    try {
      await completeSet(weight, reps);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNow(Date.now());
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const moveForward = async () => {
    if (active.exerciseIndex < active.routine.exercises.length - 1) {
      nextExercise();
      return;
    }
    setSaving(true);
    try {
      await finishWorkout();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('WorkoutSummary');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppScrollView contentStyle={{ paddingTop: spacing.sm }}>
        <Animated.View key={exercise.id} entering={FadeIn.duration(220)} style={{ gap: spacing.lg }}>
          <View style={styles.topbar}>
            <Pressable onPress={() => active.exerciseIndex ? previousExercise() : navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={25} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{exercise.name}</Text>
              <Text style={styles.subtitle}>{exercise.muscle} · {active.exerciseIndex + 1} de {active.routine.exercises.length}</Text>
            </View>
            <Text style={styles.percent}>{totalSets ? Math.round(completedTotal / totalSets * 100) : 0}%</Text>
          </View>
          <ProgressBar progress={totalSets ? completedTotal / totalSets : 0} />

          <ExerciseMedia mediaKey={exercise.mediaKey} animated style={styles.demo} />

          <Card style={styles.targets}>
            <Target value={String(exercise.sets)} label="series" />
            <Target value={`${exercise.repMin}–${exercise.repMax}`} label="repeticiones" />
            <Target value={`${exercise.restSeconds} s`} label="descanso" />
          </Card>
        </Animated.View>

        <SectionTitle title="Series" />
        <Card style={{ padding: 0 }}>
          {Array.from({ length: exercise.sets }, (_, index) => {
            const value = completed[index];
            const isCurrent = index === completed.length;
            return (
              <View key={index} style={[styles.setRow, index < exercise.sets - 1 && styles.rowBorder, isCurrent && styles.currentSet]}>
                <View style={[styles.setNumber, value && styles.setNumberDone, isCurrent && styles.setNumberCurrent]}><Text style={[styles.setNumberText, value && { color: colors.black }]}>{index + 1}</Text></View>
                <View style={styles.setValue}><Text style={styles.setLabel}>Peso</Text><Text style={styles.setText}>{value ? `${formatWeight(value.weight)} kg` : isCurrent ? `${formatWeight(weight)} kg` : '—'}</Text></View>
                <View style={styles.setValue}><Text style={styles.setLabel}>Reps</Text><Text style={styles.setText}>{value?.reps ?? (isCurrent ? reps : '—')}</Text></View>
                <View style={styles.status}>{value ? <Animated.View entering={ZoomIn.duration(260)} style={styles.statusInline}><Ionicons name="checkmark-circle" size={21} color={colors.success} /><Text style={styles.doneText}>Completada</Text></Animated.View> : isCurrent ? <><View style={styles.liveDot} /><Text style={styles.liveText}>En curso</Text></> : <Text style={styles.pendingText}>Pendiente</Text>}</View>
              </View>
            );
          })}
        </Card>

        {active.restEndsAt && restRemaining > 0 ? (
          <Card style={styles.restCard}>
            <View style={styles.timerIcon}><Ionicons name="stopwatch-outline" size={30} color={colors.primary} /></View>
            <View style={{ flex: 1 }}><Text style={styles.restLabel}>Descanso</Text><Text style={styles.timer}>{formatDuration(restRemaining)}</Text></View>
            <Pressable style={styles.pause} onPress={stopRest}><Ionicons name="play-skip-forward" size={24} color={colors.primary} /></Pressable>
          </Card>
        ) : null}

        <Card>
          <View style={styles.controls}>
            <Stepper label="Peso (kg)" value={formatWeight(weight)} onMinus={() => setWeight(value => Math.max(0, value - 2.5))} onPlus={() => setWeight(value => value + 2.5)} />
            <View style={styles.verticalDivider} />
            <Stepper label="Repeticiones" value={String(reps)} onMinus={() => setReps(value => Math.max(1, value - 1))} onPlus={() => setReps(value => value + 1)} />
          </View>
          <View style={styles.hint}><Ionicons name="information-circle-outline" size={18} color={colors.textMuted} /><Text style={styles.hintText}>Ajusta solo los valores realizados en esta serie.</Text></View>
        </Card>

        <ActionButton label={completed.length >= exercise.sets ? 'Series completadas' : 'Completar serie'} icon="checkmark" disabled={completed.length >= exercise.sets} loading={saving} onPress={() => { void recordSet(); }} />
        <ActionButton
          label={active.exerciseIndex === active.routine.exercises.length - 1 ? 'Finalizar entrenamiento' : 'Siguiente ejercicio'}
          icon={active.exerciseIndex === active.routine.exercises.length - 1 ? 'flag' : 'arrow-forward'}
          variant="outline"
          loading={saving}
          onPress={() => { void moveForward(); }}
        />
      </AppScrollView>
    </Screen>
  );
}

function Target({ value, label }: { value: string; label: string }) {
  const styles = useStyles();
  return <View style={styles.target}><Text style={styles.targetValue}>{value}</Text><Text style={styles.targetLabel}>{label}</Text></View>;
}

function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  const colors = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable onPress={onMinus} style={styles.roundControl}><Ionicons name="remove" size={23} color={colors.textMuted} /></Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable onPress={onPlus} style={styles.roundControl}><Ionicons name="add" size={24} color={colors.primary} /></Pressable>
      </View>
    </View>
  );
}

const useStyles = createThemedStyleSheet(colors => ({
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 78 },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, marginTop: 2 },
  percent: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  demo: { width: '100%', aspectRatio: 1.55, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  targets: { flexDirection: 'row', paddingVertical: spacing.xl },
  target: { flex: 1, alignItems: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
  targetValue: { color: colors.primary, fontSize: 23, fontWeight: '900' },
  targetLabel: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  setRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  currentSet: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, backgroundColor: colors.primarySoftBackground },
  setNumber: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  setNumberDone: { backgroundColor: colors.success, borderColor: colors.success },
  setNumberCurrent: { borderColor: colors.primary },
  setNumberText: { color: colors.primary, fontWeight: '900' },
  setValue: { width: 65 },
  setLabel: { color: colors.textDim, fontSize: 10 },
  setText: { color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 3 },
  status: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 5 },
  statusInline: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  doneText: { color: colors.success, fontSize: 12 }, liveText: { color: colors.primary, fontSize: 12 }, pendingText: { color: colors.textDim, fontSize: 12 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  restCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  timerIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  restLabel: { color: colors.textMuted, fontSize: 13 }, timer: { color: colors.text, fontSize: 31, fontWeight: '500', marginTop: -2 },
  pause: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row' }, verticalDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.md },
  stepper: { flex: 1, alignItems: 'center' }, stepperLabel: { color: colors.textMuted, fontSize: 13 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  roundControl: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { minWidth: 52, color: colors.text, textAlign: 'center', fontSize: 25, fontWeight: '900' },
  hint: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.xl }, hintText: { color: colors.textMuted, fontSize: 12 },
}));
