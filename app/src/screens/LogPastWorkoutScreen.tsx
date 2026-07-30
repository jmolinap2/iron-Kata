import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, Screen, SectionTitle } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { LogExerciseSheet, type QuickLoggedSet } from '../components/LogExerciseSheet';
import { useAppStore, type PastSetEntry } from '../store/useAppStore';
import type { Exercise, Routine } from '../types';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type SetRow = { weight: number; reps: number };

export function LogPastWorkoutScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteProp<RootStackParamList, 'LogPastWorkout'>>();
  const colors = useTheme();
  const styles = useStyles();
  const allRoutines = useAppStore(state => state.routines);
  const routines = useMemo(() => allRoutines.filter(item => !item.isRest), [allRoutines]);
  const allExercises = useAppStore(state => state.exercises);
  const sessions = useAppStore(state => state.sessions);
  const logPastWorkout = useAppStore(state => state.logPastWorkout);
  const initialRoutine = routines.find(item => item.id === route.params?.routineId) ?? null;
  const [baseRoutineId, setBaseRoutineId] = useState<string | null>(initialRoutine?.id ?? null);
  const [daysAgo, setDaysAgo] = useState(route.params?.daysAgo ?? 1);
  const [entries, setEntries] = useState<Record<string, SetRow[]>>(() => initialRoutine ? entriesFromRoutine(initialRoutine) : {});
  const [exerciseOrder, setExerciseOrder] = useState<string[]>(() => initialRoutine?.exercises.map(item => item.id) ?? []);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [templateVisible, setTemplateVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const lastValues = useMemo(() => {
    const values: Record<string, QuickLoggedSet | undefined> = {};
    for (const session of sessions) {
      for (const set of [...session.sets].reverse()) {
        values[set.exerciseId] ??= { weight: set.weight, reps: set.reps };
      }
    }
    return values;
  }, [sessions]);

  const selectedExercises = exerciseOrder
    .map(id => allExercises.find(item => item.id === id))
    .filter((item): item is Exercise => Boolean(item));
  const availableExercises = allExercises.filter(item => !entries[item.id]);
  const totalSets = useMemo(() => Object.values(entries).reduce((sum, sets) => sum + sets.length, 0), [entries]);
  const baseRoutine = routines.find(item => item.id === baseRoutineId) ?? null;

  const addExercise = (exercise: Exercise, sets: QuickLoggedSet[]) => {
    setEntries(value => ({ ...value, [exercise.id]: sets }));
    setExerciseOrder(value => value.includes(exercise.id) ? value : [...value, exercise.id]);
  };

  const updateSet = (exerciseId: string, index: number, patch: Partial<SetRow>) => {
    setEntries(value => ({
      ...value,
      [exerciseId]: (value[exerciseId] ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  };

  const addSet = (exercise: Exercise) => {
    setEntries(value => {
      const current = value[exercise.id] ?? [];
      const previous = current.at(-1) ?? lastValues[exercise.id] ?? { weight: 0, reps: 10 };
      return { ...value, [exercise.id]: [...current, previous] };
    });
  };

  const removeSet = (exerciseId: string, index: number) => {
    setEntries(value => ({ ...value, [exerciseId]: value[exerciseId].filter((_, itemIndex) => itemIndex !== index) }));
  };

  const removeExercise = (exercise: Exercise) => Alert.alert(
    'Quitar ejercicio',
    `¿Quitar "${exercise.name}" y sus series de este registro?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          setEntries(value => {
            const next = { ...value };
            delete next[exercise.id];
            return next;
          });
          setExerciseOrder(value => value.filter(id => id !== exercise.id));
        },
      },
    ],
  );

  const applyRoutine = (routine: Routine) => {
    const apply = () => {
      const next = entriesFromRoutine(routine, lastValues);
      setEntries(next);
      setExerciseOrder(routine.exercises.map(item => item.id));
      setBaseRoutineId(routine.id);
      setTemplateVisible(false);
    };
    if (!exerciseOrder.length) {
      apply();
      return;
    }
    Alert.alert(
      'Cargar rutina',
      'Esto reemplazará los ejercicios que ya agregaste al registro.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reemplazar', onPress: apply },
      ],
    );
  };

  const save = async () => {
    const payload: PastSetEntry[] = selectedExercises.flatMap(exercise =>
      (entries[exercise.id] ?? []).map(set => ({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        weight: set.weight,
        reps: set.reps,
      })),
    );
    if (!payload.length) {
      Alert.alert('Sin series', 'Agrega al menos una serie para registrar el entrenamiento.');
      return;
    }
    setSaving(true);
    try {
      await logPastWorkout(baseRoutineId, daysAgo, payload);
      Alert.alert(
        'Entrenamiento registrado',
        'Se guardaron únicamente los ejercicios y series que agregaste.',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppScrollView contentStyle={{ paddingTop: spacing.md }}>
        <View style={styles.topbar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={25} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Registrar entrenamiento</Text>
            <Text style={styles.subtitle}>Agrega solo lo que realmente hiciste.</Text>
          </View>
        </View>

        <Card>
          <DaysStepper value={daysAgo} onChange={setDaysAgo} />
        </Card>

        {baseRoutine ? (
          <View style={styles.basePill}>
            <Ionicons name="copy-outline" size={17} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.baseLabel}>Rutina usada como base</Text>
              <Text style={styles.baseName}>{baseRoutine.name}</Text>
            </View>
            <Pressable
              hitSlop={10}
              onPress={() => Alert.alert(
                'Desvincular rutina',
                'Los ejercicios actuales se conservarán y el registro quedará como entrenamiento libre.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Desvincular', onPress: () => setBaseRoutineId(null) },
                ],
              )}
            >
              <Ionicons name="close-circle" size={22} color={colors.textDim} />
            </Pressable>
          </View>
        ) : null}

        <SectionTitle
          title={`Ejercicios realizados (${selectedExercises.length})`}
          action="Agregar"
          onAction={() => setPickerVisible(true)}
        />

        {!selectedExercises.length ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Ionicons name="add" size={29} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>¿Qué entrenaste?</Text>
            <Text style={styles.emptyBody}>Empieza vacío y agrega cada ejercicio con su peso, repeticiones y series.</Text>
            <ActionButton label="Agregar ejercicio" icon="add" onPress={() => setPickerVisible(true)} />
            <Pressable style={styles.templateLink} onPress={() => setTemplateVisible(true)}>
              <Ionicons name="copy-outline" size={18} color={colors.primary} />
              <Text style={styles.templateLinkText}>Cargar una rutina como base</Text>
            </Pressable>
          </Card>
        ) : selectedExercises.map(exercise => (
          <Card key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseTop}>
              <ExerciseMedia mediaKey={exercise.mediaKey} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.meta}>{exercise.muscle} · {(entries[exercise.id] ?? []).length} series</Text>
              </View>
              <Pressable style={styles.removeExercise} onPress={() => removeExercise(exercise)}>
                <Ionicons name="trash-outline" size={19} color={colors.danger} />
              </Pressable>
            </View>

            {(entries[exercise.id] ?? []).map((set, index) => (
              <View key={index} style={styles.setRow}>
                <View style={styles.setNumber}><Text style={styles.setNumberText}>{index + 1}</Text></View>
                <InlineNumber
                  label="kg"
                  value={set.weight}
                  min={0}
                  max={1000}
                  step={2.5}
                  decimal
                  onChange={weight => updateSet(exercise.id, index, { weight })}
                />
                <InlineNumber
                  label="reps"
                  value={set.reps}
                  min={1}
                  max={100}
                  step={1}
                  onChange={reps => updateSet(exercise.id, index, { reps })}
                />
                <Pressable onPress={() => removeSet(exercise.id, index)} hitSlop={8}>
                  <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
                </Pressable>
              </View>
            ))}

            <Pressable style={styles.addSet} onPress={() => addSet(exercise)}>
              <Ionicons name="add-circle-outline" size={19} color={colors.primary} />
              <Text style={styles.addSetText}>Agregar serie</Text>
            </Pressable>
          </Card>
        ))}

        {selectedExercises.length ? (
          <>
            <ActionButton label="Agregar otro ejercicio" icon="add" variant="outline" onPress={() => setPickerVisible(true)} />
            <Pressable style={styles.templateLink} onPress={() => setTemplateVisible(true)}>
              <Ionicons name="copy-outline" size={18} color={colors.primary} />
              <Text style={styles.templateLinkText}>Reemplazar con una rutina</Text>
            </Pressable>
            <ActionButton
              label={`Guardar entrenamiento · ${totalSets} series`}
              icon="save-outline"
              loading={saving}
              disabled={!totalSets}
              onPress={() => { void save(); }}
            />
          </>
        ) : null}
      </AppScrollView>

      <LogExerciseSheet
        visible={pickerVisible}
        exercises={availableExercises}
        lastValues={lastValues}
        onAdd={addExercise}
        onClose={() => setPickerVisible(false)}
      />
      <RoutineTemplateSheet
        visible={templateVisible}
        routines={routines}
        onSelect={applyRoutine}
        onClose={() => setTemplateVisible(false)}
      />
    </Screen>
  );
}

function entriesFromRoutine(routine: Routine, lastValues: Record<string, QuickLoggedSet | undefined> = {}) {
  const initial: Record<string, SetRow[]> = {};
  for (const exercise of routine.exercises) {
    const previous = lastValues[exercise.id] ?? { weight: exercise.lastWeight ?? 0, reps: exercise.repMin };
    initial[exercise.id] = Array.from({ length: exercise.sets }, () => ({ ...previous }));
  }
  return initial;
}

function DaysStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const colors = useTheme();
  const styles = useStyles();
  const label = value === 0 ? 'Hoy' : value === 1 ? 'Ayer' : `Hace ${value} días`;
  return (
    <View style={styles.daysRow}>
      <Text style={styles.fieldLabel}>¿Cuándo lo hiciste?</Text>
      <View style={styles.daysControls}>
        <Pressable style={styles.round} onPress={() => onChange(Math.max(0, value - 1))}>
          <Ionicons name="remove" size={20} color={colors.textMuted} />
        </Pressable>
        <Text style={styles.daysValue}>{label}</Text>
        <Pressable style={styles.round} onPress={() => onChange(Math.min(365, value + 1))}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function InlineNumber({
  label,
  value,
  min,
  max,
  step,
  decimal = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimal?: boolean;
  onChange: (value: number) => void;
}) {
  const colors = useTheme();
  const styles = useStyles();
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const clamp = (next: number) => Math.max(min, Math.min(max, next));
  const commit = () => {
    const parsed = Number(text.replace(',', '.'));
    const next = Number.isFinite(parsed) ? clamp(parsed) : value;
    onChange(next);
    setText(String(next));
  };
  const changeBy = (delta: number) => {
    const next = clamp(Math.round((value + delta) * 100) / 100);
    onChange(next);
    setText(String(next));
  };
  return (
    <View style={styles.inlineNumber}>
      <Text style={styles.inlineLabel}>{label}</Text>
      <View style={styles.inlineControls}>
        <Pressable onPress={() => changeBy(-step)}><Ionicons name="remove-circle-outline" size={19} color={colors.textMuted} /></Pressable>
        <TextInput
          style={styles.inlineInput}
          value={text}
          onChangeText={next => {
            const normalized = next.replace(',', '.');
            const pattern = decimal ? /^\d*\.?\d*$/ : /^\d*$/;
            if (!pattern.test(normalized)) return;
            setText(next);
            if (normalized && !normalized.endsWith('.')) {
              const parsed = Number(normalized);
              if (Number.isFinite(parsed)) onChange(clamp(parsed));
            }
          }}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
        />
        <Pressable onPress={() => changeBy(step)}><Ionicons name="add-circle-outline" size={19} color={colors.primary} /></Pressable>
      </View>
    </View>
  );
}

function RoutineTemplateSheet({
  visible,
  routines,
  onSelect,
  onClose,
}: {
  visible: boolean;
  routines: Routine[];
  onSelect: (routine: Routine) => void;
  onClose: () => void;
}) {
  const colors = useTheme();
  const styles = useStyles();
  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.templateSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Cargar rutina</Text>
              <Text style={styles.modalSubtitle}>Úsala como punto de partida y quita lo que no hiciste.</Text>
            </View>
            <Pressable style={styles.modalClose} onPress={onClose}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.templateList}>
            {routines.map(routine => (
              <Pressable key={routine.id} style={styles.templateRow} onPress={() => onSelect(routine)}>
                {routine.exercises[0] ? <ExerciseMedia mediaKey={routine.exercises[0].mediaKey} style={styles.templateThumb} /> : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.templateName}>{routine.name}</Text>
                  <Text style={styles.templateMeta}>{routine.exercises.length} ejercicios · {routine.exercises.reduce((sum, item) => sum + item.sets, 0)} series</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.primary} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyleSheet(colors => ({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 86 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  subtitle: { color: colors.textMuted, marginTop: 3, fontSize: 12 },
  fieldLabel: { color: colors.textMuted, fontSize: 12 },
  daysRow: { gap: spacing.md },
  daysControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, justifyContent: 'center' },
  round: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  daysValue: { color: colors.text, fontWeight: '900', fontSize: 18, minWidth: 140, textAlign: 'center' },
  basePill: { minHeight: 56, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primaryBorder, backgroundColor: colors.primarySoftBackground, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  baseLabel: { color: colors.textMuted, fontSize: 9, textTransform: 'uppercase', fontWeight: '800' },
  baseName: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  emptyCard: { alignItems: 'stretch', paddingVertical: spacing.xxl },
  emptyIcon: { width: 58, height: 58, borderRadius: 19, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: spacing.md },
  emptyBody: { color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: spacing.xs, marginBottom: spacing.lg },
  templateLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  templateLinkText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  exerciseCard: { padding: spacing.md },
  exerciseTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  thumb: { width: 68, height: 50 },
  exerciseName: { color: colors.text, fontWeight: '800', fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  removeExercise: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerSurface },
  setRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft },
  setNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  setNumberText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  inlineNumber: { flex: 1, alignItems: 'center' },
  inlineLabel: { color: colors.textDim, fontSize: 9, fontWeight: '700' },
  inlineControls: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  inlineInput: { minWidth: 40, maxWidth: 54, color: colors.text, fontWeight: '900', fontSize: 14, textAlign: 'center', paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: colors.primaryBorder },
  addSet: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, alignSelf: 'flex-start', minHeight: 38 },
  addSetText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2,3,4,0.72)' },
  templateSheet: { maxHeight: '78%', backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border, paddingTop: spacing.sm },
  modalHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  modalTitle: { color: colors.text, fontSize: 23, fontWeight: '900' },
  modalSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  modalClose: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  templateList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  templateRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft },
  templateThumb: { width: 68, height: 50 },
  templateName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  templateMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
}));
