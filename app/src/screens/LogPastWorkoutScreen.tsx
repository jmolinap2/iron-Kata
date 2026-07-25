import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, Screen, SectionTitle } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { useAppStore, type PastSetEntry } from '../store/useAppStore';
import type { PlannedExercise } from '../types';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';
import { formatWeight } from '../utils/format';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type SetRow = { weight: number; reps: number };

export function LogPastWorkoutScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteProp<RootStackParamList, 'LogPastWorkout'>>();
  const colors = useTheme();
  const styles = useStyles();
  const allRoutines = useAppStore(state => state.routines);
  const routines = useMemo(() => allRoutines.filter(item => !item.isRest), [allRoutines]);
  const logPastWorkout = useAppStore(state => state.logPastWorkout);
  const [routineId, setRoutineId] = useState<string | null>(route.params?.routineId ?? null);
  const [daysAgo, setDaysAgo] = useState(1);
  const [entries, setEntries] = useState<Record<string, SetRow[]>>({});
  const [saving, setSaving] = useState(false);

  const routine = routines.find(item => item.id === routineId) ?? null;

  const initRoutine = (id: string) => {
    const source = routines.find(item => item.id === id);
    if (!source) return;
    const initial: Record<string, SetRow[]> = {};
    for (const exercise of source.exercises) {
      initial[exercise.id] = Array.from({ length: exercise.sets }, () => ({ weight: exercise.lastWeight ?? 0, reps: exercise.repMin }));
    }
    setEntries(initial);
    setRoutineId(id);
  };

  const updateSet = (exerciseId: string, index: number, patch: Partial<SetRow>) => {
    setEntries(value => ({ ...value, [exerciseId]: value[exerciseId].map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  };
  const addSet = (exercise: PlannedExercise) => setEntries(value => ({ ...value, [exercise.id]: [...value[exercise.id], { weight: exercise.lastWeight ?? 0, reps: exercise.repMin }] }));
  const removeSet = (exerciseId: string, index: number) => setEntries(value => ({ ...value, [exerciseId]: value[exerciseId].filter((_, itemIndex) => itemIndex !== index) }));

  const totalSets = useMemo(() => Object.values(entries).reduce((sum, sets) => sum + sets.length, 0), [entries]);

  const save = async () => {
    if (!routine) return;
    const payload: PastSetEntry[] = routine.exercises.flatMap(exercise =>
      (entries[exercise.id] ?? []).map(set => ({ exerciseId: exercise.id, exerciseName: exercise.name, weight: set.weight, reps: set.reps })),
    );
    if (!payload.length) { Alert.alert('Sin series', 'Agrega al menos una serie para registrar el entrenamiento.'); return; }
    setSaving(true);
    try {
      await logPastWorkout(routine.id, daysAgo, payload);
      Alert.alert('Entrenamiento registrado', 'Se guardó correctamente en tu historial.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }]);
    } finally { setSaving(false); }
  };

  return (
    <Screen>
      <AppScrollView contentStyle={{ paddingTop: spacing.md }}>
        <View style={styles.topbar}>
          <Pressable onPress={() => routine ? setRoutineId(null) : navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={25} color={colors.text} /></Pressable>
          <View><Text style={styles.title}>Registrar entrenamiento</Text><Text style={styles.subtitle}>{routine ? routine.name : 'Elige la rutina que hiciste'}</Text></View>
        </View>

        {!routine ? routines.map((item, index) => (
          <Card key={item.id} delay={index * 40}>
            <Pressable style={styles.routineRow} onPress={() => initRoutine(item.id)}>
              <View style={{ flex: 1 }}><Text style={styles.routineName}>{item.name}</Text><Text style={styles.meta}>{item.exercises.length} ejercicios</Text></View>
              <Ionicons name="chevron-forward" size={22} color={colors.textDim} />
            </Pressable>
          </Card>
        )) : (
          <>
            <Card>
              <DaysStepper value={daysAgo} onChange={setDaysAgo} />
            </Card>

            {routine.exercises.map(exercise => (
              <Card key={exercise.id}>
                <View style={styles.exerciseTop}>
                  <ExerciseMedia mediaKey={exercise.mediaKey} style={styles.thumb} />
                  <View style={{ flex: 1 }}><Text style={styles.exerciseName}>{exercise.name}</Text><Text style={styles.meta}>{exercise.muscle}</Text></View>
                </View>
                {(entries[exercise.id] ?? []).map((set, index) => (
                  <View key={index} style={styles.setRow}>
                    <Text style={styles.setNumber}>{index + 1}</Text>
                    <SetStepper label="kg" value={set.weight} step={2.5} min={0} onChange={weight => updateSet(exercise.id, index, { weight })} format={formatWeight} />
                    <SetStepper label="reps" value={set.reps} step={1} min={1} onChange={reps => updateSet(exercise.id, index, { reps })} />
                    <Pressable onPress={() => removeSet(exercise.id, index)} hitSlop={8}><Ionicons name="close-circle-outline" size={22} color={colors.danger} /></Pressable>
                  </View>
                ))}
                <Pressable style={styles.addSet} onPress={() => addSet(exercise)}><Ionicons name="add-circle-outline" size={18} color={colors.primary} /><Text style={styles.addSetText}>Agregar serie</Text></Pressable>
              </Card>
            ))}

            <ActionButton label={`Guardar entrenamiento (${totalSets} series)`} icon="save-outline" loading={saving} disabled={!totalSets} onPress={() => { void save(); }} />
          </>
        )}
      </AppScrollView>
    </Screen>
  );
}

function DaysStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const colors = useTheme();
  const styles = useStyles();
  const label = value === 0 ? 'Hoy' : value === 1 ? 'Ayer' : `Hace ${value} días`;
  return <View style={styles.daysRow}>
    <Text style={styles.fieldLabel}>¿Cuándo lo hiciste?</Text>
    <View style={styles.daysControls}>
      <Pressable style={styles.round} onPress={() => onChange(Math.max(0, value - 1))}><Ionicons name="remove" size={20} color={colors.textMuted} /></Pressable>
      <Text style={styles.daysValue}>{label}</Text>
      <Pressable style={styles.round} onPress={() => onChange(Math.min(30, value + 1))}><Ionicons name="add" size={20} color={colors.primary} /></Pressable>
    </View>
  </View>;
}

function SetStepper({ label, value, step, min, onChange, format }: { label: string; value: number; step: number; min: number; onChange: (value: number) => void; format?: (value: number) => string }) {
  const colors = useTheme();
  const styles = useStyles();
  return <View style={styles.stepper}>
    <Pressable onPress={() => onChange(Math.max(min, value - step))}><Ionicons name="remove-circle-outline" size={19} color={colors.textMuted} /></Pressable>
    <Text style={styles.stepperValue}>{format ? format(value) : value}</Text>
    <Pressable onPress={() => onChange(value + step)}><Ionicons name="add-circle-outline" size={19} color={colors.primary} /></Pressable>
    <Text style={styles.stepperLabel}>{label}</Text>
  </View>;
}

const useStyles = createThemedStyleSheet(colors => ({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 86 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 24, fontWeight: '900' }, subtitle: { color: colors.textMuted, marginTop: 3 },
  routineRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, routineName: { color: colors.text, fontWeight: '800', fontSize: 16 }, meta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  fieldLabel: { color: colors.textMuted, fontSize: 12 },
  daysRow: { gap: spacing.md }, daysControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, justifyContent: 'center' },
  round: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, daysValue: { color: colors.text, fontWeight: '900', fontSize: 18, minWidth: 120, textAlign: 'center' },
  exerciseTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }, thumb: { width: 66, height: 48 }, exerciseName: { color: colors.text, fontWeight: '800', fontSize: 15 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 46, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  setNumber: { color: colors.textDim, width: 16, fontSize: 12, fontWeight: '800' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 5 }, stepperValue: { color: colors.text, minWidth: 40, textAlign: 'center', fontWeight: '800' }, stepperLabel: { color: colors.textMuted, fontSize: 10, marginLeft: 2 },
  addSet: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, alignSelf: 'flex-start' }, addSetText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
}));
