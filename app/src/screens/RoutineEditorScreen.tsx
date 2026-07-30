import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, LayoutAnimation, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, Screen, SectionTitle } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { ExercisePickerSheet } from '../components/ExercisePickerSheet';
import { LongPressDragArea } from '../components/LongPressDragArea';
import { useAppStore } from '../store/useAppStore';
import type { Exercise, MuscleGroup, PlannedExercise, Routine } from '../types';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export function RoutineEditorScreen() {
  const navigation = useNavigation();
  const colors = useTheme();
  const styles = useStyles();
  const route = useRoute<RouteProp<RootStackParamList, 'RoutineEditor'>>();
  const routines = useAppStore(state => state.routines);
  const allExercises = useAppStore(state => state.exercises);
  const saveRoutine = useAppStore(state => state.saveRoutine);
  const deleteRoutine = useAppStore(state => state.deleteRoutine);
  const source = routines.find(item => item.id === route.params?.routineId);
  const [draft, setDraft] = useState<Routine>(() => source ? clone(source) : {
    id: `custom-${Date.now()}`,
    name: 'Mi rutina',
    orderIndex: routines.length,
    muscles: [],
    isRest: false,
    active: true,
    exercises: [],
  });
  const original = useRef(JSON.stringify(draft));
  const allowExit = useRef(false);
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(draft.exercises[0]?.id ?? null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef(new Animated.Value(0)).current;
  const exerciseLayouts = useRef<Record<string, { y: number; height: number }>>({});
  const dragStartTop = useRef(0);
  const dragVisualTop = useRef(0);
  const dragHeight = useRef(0);
  const dragLayoutPending = useRef(false);

  useEffect(() => navigation.addListener('beforeRemove', event => {
    if (allowExit.current || JSON.stringify(draft) === original.current) return;
    event.preventDefault();
    Alert.alert(
      'Cambios sin guardar',
      '¿Quieres salir y descartar los cambios de esta rutina?',
      [
        { text: 'Seguir editando', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            allowExit.current = true;
            navigation.dispatch(event.data.action);
          },
        },
      ],
    );
  }), [draft, navigation]);

  const updateExercise = (index: number, patch: Partial<PlannedExercise>) => {
    setDraft(value => ({
      ...value,
      exercises: value.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  };

  const handleDragStart = (id: string) => {
    const layout = exerciseLayouts.current[id];
    dragStartTop.current = layout?.y ?? 0;
    dragVisualTop.current = dragStartTop.current;
    dragHeight.current = layout?.height ?? 0;
    dragLayoutPending.current = false;
    dragOffset.setValue(0);
    setDraggingId(id);
  };

  const handleDragMove = (id: string, offset: number) => {
    dragVisualTop.current = dragStartTop.current + offset;
    const currentLayout = exerciseLayouts.current[id];
    if (currentLayout) dragOffset.setValue(dragVisualTop.current - currentLayout.y);
    if (dragLayoutPending.current) return;

    setDraft(value => {
      const fromIndex = value.exercises.findIndex(item => item.id === id);
      const slot = exerciseLayouts.current[id];
      if (fromIndex < 0 || !slot) return value;
      const visualCenter = dragVisualTop.current + (dragHeight.current || slot.height) / 2;
      const slotCenter = slot.y + slot.height / 2;
      let toIndex = fromIndex;

      if (visualCenter > slotCenter && fromIndex < value.exercises.length - 1) {
        const nextLayout = exerciseLayouts.current[value.exercises[fromIndex + 1].id];
        if (nextLayout && visualCenter > (slotCenter + nextLayout.y + nextLayout.height / 2) / 2) {
          toIndex = fromIndex + 1;
        }
      } else if (visualCenter < slotCenter && fromIndex > 0) {
        const previousLayout = exerciseLayouts.current[value.exercises[fromIndex - 1].id];
        if (previousLayout && visualCenter < (slotCenter + previousLayout.y + previousLayout.height / 2) / 2) {
          toIndex = fromIndex - 1;
        }
      }

      if (toIndex === fromIndex) return value;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      dragLayoutPending.current = true;
      const exercises = [...value.exercises];
      const [moved] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, moved);
      return { ...value, exercises };
    });
  };

  const handleDragEnd = (id: string, startPointerY: number, pointerY: number) => {
    handleDragMove(id, pointerY - startPointerY);
    setDraggingId(null);
    dragLayoutPending.current = false;
    dragOffset.setValue(0);
  };

  const handleDragCancel = () => {
    setDraggingId(null);
    dragLayoutPending.current = false;
    dragOffset.setValue(0);
  };

  const remove = (index: number) => setDraft(value => ({
    ...value,
    exercises: value.exercises.filter((_, itemIndex) => itemIndex !== index),
  }));

  const add = (item: Exercise) => {
    setDraft(value => ({
      ...value,
      exercises: [
        ...value.exercises,
        {
          ...item,
          routineId: value.id,
          position: value.exercises.length,
          sets: 3,
          repMin: 8,
          repMax: 12,
          restSeconds: 90,
          lastWeight: null,
        },
      ],
    }));
    setExpandedId(item.id);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      Alert.alert('Nombre requerido', 'Escribe un nombre para la rutina.');
      return;
    }
    if (!draft.isRest && !draft.exercises.length) {
      Alert.alert('Añade ejercicios', 'Una rutina de entrenamiento necesita al menos un ejercicio.');
      return;
    }
    setSaving(true);
    try {
      const exercises = draft.exercises.map((item, index) => ({ ...item, routineId: draft.id, position: index }));
      const muscles = [...new Set(exercises.map(item => item.muscle))] as MuscleGroup[];
      await saveRoutine({ ...draft, name: draft.name.trim(), exercises, muscles: draft.isRest ? ['Descanso'] : muscles });
      allowExit.current = true;
      Alert.alert('Rutina guardada', 'El orden y los objetivos quedaron actualizados.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const removeRoutine = () => Alert.alert(
    'Eliminar rutina',
    `La rutina "${draft.name}" dejará de aparecer. Tus entrenamientos ya guardados se conservarán.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          allowExit.current = true;
          void deleteRoutine(draft.id).then(() => navigation.goBack());
        },
      },
    ],
  );

  const usedElsewhere = useMemo(
    () => new Set(routines.filter(routine => routine.id !== draft.id).flatMap(routine => routine.exercises.map(item => item.id))),
    [draft.id, routines],
  );
  const available = allExercises.filter(item => !draft.exercises.some(selected => selected.id === item.id));
  const selectedMuscles = [...new Set(draft.exercises.map(item => item.muscle))] as MuscleGroup[];

  return (
    <Screen>
      <AppScrollView contentStyle={{ paddingTop: spacing.md }}>
        <View style={styles.topbar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={25} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{source ? 'Editar rutina' : 'Crear rutina'}</Text>
            <Text style={styles.subtitle}>Hazla tuya: orden, volumen y descansos.</Text>
          </View>
        </View>

        <Card>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.nameInput}
            value={draft.name}
            onChangeText={name => setDraft(value => ({ ...value, name }))}
            placeholder="Ej. Empuje, torso o pierna"
            placeholderTextColor={colors.textDim}
            selectTextOnFocus
          />
          {draft.isRest ? (
            <View style={styles.restNotice}>
              <Ionicons name="moon" size={22} color={colors.primary} />
              <Text style={styles.restText}>Este bloque marca un descanso dentro de la secuencia.</Text>
            </View>
          ) : selectedMuscles.length ? (
            <View style={styles.muscleSummary}>
              {selectedMuscles.map(muscle => <View key={muscle} style={styles.musclePill}><Text style={styles.musclePillText}>{muscle}</Text></View>)}
            </View>
          ) : null}
        </Card>

        {!draft.isRest ? (
          <>
            <SectionTitle
              title={`Ejercicios (${draft.exercises.length})`}
              action="Agregar"
              onAction={() => setPickerVisible(true)}
            />

            {draft.exercises.length > 1 ? (
              <View style={styles.dragHint}>
                <Ionicons name="hand-left-outline" size={16} color={colors.primary} />
                <Text style={styles.dragHintText}>Mantén pulsado un ejercicio y arrástralo para cambiar el orden.</Text>
              </View>
            ) : null}

            {!draft.exercises.length ? (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyIcon}><Ionicons name="barbell-outline" size={28} color={colors.primary} /></View>
                <Text style={styles.emptyTitle}>Tu rutina está vacía</Text>
                <Text style={styles.emptyBody}>Agrega ejercicios y después ajusta sus series, repeticiones y descanso.</Text>
                <Pressable style={styles.emptyAction} onPress={() => setPickerVisible(true)}>
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.emptyActionText}>Elegir ejercicios</Text>
                </Pressable>
              </Card>
            ) : draft.exercises.map((item, index) => {
              const expanded = expandedId === item.id;
              return (
                <Animated.View
                  key={item.id}
                  onLayout={event => {
                    const nextLayout = {
                      y: event.nativeEvent.layout.y,
                      height: event.nativeEvent.layout.height,
                    };
                    exerciseLayouts.current[item.id] = nextLayout;
                    if (draggingId === item.id) {
                      dragLayoutPending.current = false;
                      dragOffset.setValue(dragVisualTop.current - nextLayout.y);
                    }
                  }}
                  style={[
                    draggingId === item.id && styles.draggingCard,
                    draggingId === item.id && { transform: [{ translateY: dragOffset }, { scale: 1.015 }] },
                  ]}
                >
                  <Card style={[styles.exerciseCard, expanded && styles.exerciseCardExpanded]}>
                    <LongPressDragArea
                      accessibilityLabel={`${item.name}. Toca para configurar o mantén pulsado y arrastra para cambiar su posición.`}
                      style={styles.exerciseHeader}
                      onTap={() => setExpandedId(expanded ? null : item.id)}
                      onDragStart={() => handleDragStart(item.id)}
                      onDragMove={offset => handleDragMove(item.id, offset)}
                      onDragEnd={(startPointerY, pointerY) => handleDragEnd(item.id, startPointerY, pointerY)}
                      onDragCancel={handleDragCancel}
                    >
                      <View style={[styles.dragHandle, draggingId === item.id && styles.dragHandleActive]}>
                        <View style={styles.position}><Text style={styles.positionText}>{index + 1}</Text></View>
                        <Ionicons name="reorder-three-outline" size={20} color={draggingId === item.id ? colors.primary : colors.textDim} />
                      </View>
                      <View style={styles.exerciseMain}>
                        <ExerciseMedia mediaKey={item.mediaKey} style={styles.thumb} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.exerciseName}>{item.name}</Text>
                          <Text style={styles.exerciseSummary}>{item.muscle} · {item.sets}×{item.repMin}–{item.repMax} · {item.restSeconds} s</Text>
                        </View>
                        <Ionicons name={expanded ? 'chevron-up' : 'options-outline'} size={22} color={expanded ? colors.primary : colors.textDim} />
                      </View>
                    </LongPressDragArea>

                  {expanded ? (
                    <View style={styles.exerciseDetails}>
                      <View style={styles.configGrid}>
                        <NumberControl label="Series" value={item.sets} min={1} max={8} step={1} onChange={sets => updateExercise(index, { sets })} />
                        <NumberControl
                          label="Repeticiones mín."
                          value={item.repMin}
                          min={1}
                          max={30}
                          step={1}
                          onChange={repMin => updateExercise(index, { repMin, repMax: Math.max(repMin, item.repMax) })}
                        />
                        <NumberControl label="Repeticiones máx." value={item.repMax} min={item.repMin} max={40} step={1} onChange={repMax => updateExercise(index, { repMax })} />
                        <NumberControl label="Descanso (s)" value={item.restSeconds} min={15} max={600} step={15} onChange={restSeconds => updateExercise(index, { restSeconds })} />
                      </View>

                      <View style={styles.exerciseActions}>
                        <Pressable style={styles.removeButton} onPress={() => remove(index)}>
                          <Ionicons name="trash-outline" size={19} color={colors.danger} />
                          <Text style={styles.removeText}>Quitar</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                  </Card>
                </Animated.View>
              );
            })}

            {draft.exercises.length ? (
              <ActionButton label="Agregar más ejercicios" icon="add" variant="outline" onPress={() => setPickerVisible(true)} />
            ) : null}
          </>
        ) : null}

        <ActionButton label="Guardar rutina" icon="save-outline" loading={saving} onPress={() => { void save(); }} />
        {source ? (
          <Pressable style={styles.deleteRoutine} onPress={removeRoutine}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.deleteRoutineText}>Eliminar rutina</Text>
          </Pressable>
        ) : null}
      </AppScrollView>

      <ExercisePickerSheet
        visible={pickerVisible}
        exercises={available}
        usedExerciseIds={usedElsewhere}
        suggestedMuscles={selectedMuscles}
        onAdd={add}
        onClose={() => setPickerVisible(false)}
      />
    </Screen>
  );
}

function NumberControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const colors = useTheme();
  const styles = useStyles();
  const clamp = (next: number) => onChange(Math.max(min, Math.min(max, next)));
  return (
    <View style={styles.numberControl}>
      <Text style={styles.numberLabel}>{label}</Text>
      <View style={styles.numberRow}>
        <Pressable style={styles.numberButton} onPress={() => clamp(value - step)}>
          <Ionicons name="remove" size={20} color={colors.textMuted} />
        </Pressable>
        <TextInput
          style={styles.numberInput}
          value={String(value)}
          onChangeText={text => {
            const parsed = Number(text);
            if (text && Number.isFinite(parsed)) clamp(parsed);
          }}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <Pressable style={styles.numberButton} onPress={() => clamp(value + step)}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = createThemedStyleSheet(colors => ({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 86 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.textMuted, marginTop: 3, fontSize: 12 },
  label: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm },
  nameInput: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSoft, paddingHorizontal: spacing.md, fontSize: 17, fontWeight: '700' },
  restNotice: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, alignItems: 'center' },
  restText: { color: colors.textMuted, flex: 1 },
  muscleSummary: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  musclePill: { borderRadius: radius.pill, backgroundColor: colors.primarySoftBackground, borderWidth: 1, borderColor: colors.primaryBorder, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  musclePillText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  dragHint: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: -spacing.xs, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  dragHintText: { color: colors.textMuted, fontSize: 11, flex: 1 },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: spacing.md },
  emptyBody: { color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: spacing.xs, maxWidth: 280 },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44, marginTop: spacing.lg },
  emptyActionText: { color: colors.primary, fontWeight: '800' },
  exerciseCard: { padding: spacing.md },
  exerciseCardExpanded: { borderColor: colors.primaryBorder },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 58 },
  exerciseMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 58 },
  dragHandle: { minWidth: 48, minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 1 },
  dragHandleActive: { backgroundColor: colors.primarySoftBackground, borderWidth: 1, borderColor: colors.primaryBorder },
  draggingCard: { zIndex: 10, elevation: 8, shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  position: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  positionText: { color: colors.primary, fontWeight: '900' },
  thumb: { width: 68, height: 50 },
  exerciseName: { color: colors.text, fontWeight: '800', fontSize: 15 },
  exerciseSummary: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  exerciseDetails: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md },
  configGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  numberControl: { flexGrow: 1, flexBasis: '47%', backgroundColor: colors.backgroundSoft, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.borderSoft },
  numberLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginBottom: spacing.sm },
  numberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  numberButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  numberInput: { minWidth: 42, color: colors.text, fontSize: 17, fontWeight: '900', textAlign: 'center', paddingVertical: 0 },
  exerciseActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  removeButton: { flex: 1, minHeight: 44, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: colors.dangerSurface },
  removeText: { color: colors.danger, fontSize: 11, fontWeight: '800' },
  disabled: { opacity: 0.35 },
  deleteRoutine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 50, marginTop: spacing.sm },
  deleteRoutineText: { color: colors.danger, fontWeight: '700' },
}));
