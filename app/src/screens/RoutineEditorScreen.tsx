import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, Screen, SectionTitle } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { useAppStore } from '../store/useAppStore';
import type { MuscleGroup, PlannedExercise, Routine } from '../types';
import { colors, radius, spacing } from '../theme';

export function RoutineEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'RoutineEditor'>>();
  const routines = useAppStore(state => state.routines);
  const saveRoutine = useAppStore(state => state.saveRoutine);
  const source = routines.find(item => item.id === route.params?.routineId);
  const allExercises = useMemo(() => {
    const map = new Map<string, PlannedExercise>();
    routines.flatMap(item => item.exercises).forEach(item => map.set(item.id, item));
    return [...map.values()];
  }, [routines]);
  const [draft, setDraft] = useState<Routine>(() => source ? JSON.parse(JSON.stringify(source)) : {
    id: `custom-${Date.now()}`, name: 'Mi rutina', orderIndex: routines.length,
    muscles: [], isRest: false, active: true, exercises: [],
  });
  const [saving, setSaving] = useState(false);

  const updateExercise = (index: number, patch: Partial<PlannedExercise>) => setDraft(value => ({ ...value, exercises: value.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  const move = (index: number, direction: -1 | 1) => setDraft(value => {
    const target = index + direction; if (target < 0 || target >= value.exercises.length) return value;
    const exercises = [...value.exercises]; [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
    return { ...value, exercises };
  });
  const remove = (index: number) => setDraft(value => ({ ...value, exercises: value.exercises.filter((_, itemIndex) => itemIndex !== index) }));
  const add = (item: PlannedExercise) => setDraft(value => ({ ...value, exercises: [...value.exercises, { ...item, routineId: value.id, position: value.exercises.length, sets: 3, repMin: 8, repMax: 12, restSeconds: 90, lastWeight: null }] }));

  const save = async () => {
    if (!draft.name.trim()) { Alert.alert('Nombre requerido', 'Escribe un nombre para la rutina.'); return; }
    if (!draft.isRest && !draft.exercises.length) { Alert.alert('Añade ejercicios', 'Una rutina de entrenamiento necesita al menos un ejercicio.'); return; }
    setSaving(true);
    try {
      const exercises = draft.exercises.map((item, index) => ({ ...item, routineId: draft.id, position: index }));
      const muscles = [...new Set(exercises.map(item => item.muscle))] as MuscleGroup[];
      await saveRoutine({ ...draft, name: draft.name.trim(), exercises, muscles: draft.isRest ? ['Descanso'] : muscles });
      Alert.alert('Rutina guardada', 'La secuencia se actualizó correctamente.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }]);
    } finally { setSaving(false); }
  };

  const available = allExercises.filter(item => !draft.exercises.some(selected => selected.id === item.id));
  return <Screen><AppScrollView contentStyle={{ paddingTop: spacing.md }}>
    <View style={styles.topbar}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={25} color={colors.text}/></Pressable><View><Text style={styles.title}>{source ? 'Editar rutina' : 'Crear rutina'}</Text><Text style={styles.subtitle}>Orden y objetivos simples.</Text></View></View>
    <Card><Text style={styles.label}>Nombre</Text><TextInput style={styles.input} value={draft.name} onChangeText={name => setDraft(value => ({ ...value, name }))}/>{draft.isRest ? <View style={styles.restNotice}><Ionicons name="moon" size={22} color={colors.primary}/><Text style={styles.restText}>Este bloque marca un descanso dentro de la secuencia.</Text></View> : null}</Card>
    {!draft.isRest ? <>
      <SectionTitle title="Ejercicios en orden" />
      {draft.exercises.map((item, index) => <Card key={item.id} style={{ padding: spacing.md }}>
        <View style={styles.exerciseTop}><View style={styles.position}><Text style={styles.positionText}>{index + 1}</Text></View><ExerciseMedia mediaKey={item.mediaKey} style={styles.thumb}/><View style={{ flex: 1 }}><Text style={styles.exerciseName}>{item.name}</Text><Text style={styles.muscle}>{item.muscle}</Text></View><View style={styles.actions}><Pressable onPress={() => move(index, -1)} disabled={index === 0}><Ionicons name="arrow-up" size={20} color={index === 0 ? colors.textDim : colors.primary}/></Pressable><Pressable onPress={() => move(index, 1)} disabled={index === draft.exercises.length - 1}><Ionicons name="arrow-down" size={20} color={index === draft.exercises.length - 1 ? colors.textDim : colors.primary}/></Pressable><Pressable onPress={() => remove(index)}><Ionicons name="trash-outline" size={20} color={colors.danger}/></Pressable></View></View>
        <View style={styles.configRow}><MiniCounter label="Series" value={item.sets} min={1} max={8} step={1} onChange={sets => updateExercise(index, { sets })}/><MiniCounter label="Rep mín." value={item.repMin} min={1} max={30} step={1} onChange={repMin => updateExercise(index, { repMin, repMax: Math.max(repMin, item.repMax) })}/><MiniCounter label="Rep máx." value={item.repMax} min={item.repMin} max={40} step={1} onChange={repMax => updateExercise(index, { repMax })}/><MiniCounter label="Descanso" value={item.restSeconds} min={30} max={300} step={15} onChange={restSeconds => updateExercise(index, { restSeconds })}/></View>
      </Card>)}
      {available.length ? <Card><SectionTitle title="Añadir ejercicio" />{available.map(item => <Pressable key={item.id} style={styles.addRow} onPress={() => add(item)}><ExerciseMedia mediaKey={item.mediaKey} style={styles.addThumb}/><View style={{ flex: 1 }}><Text style={styles.addName}>{item.name}</Text><Text style={styles.muscle}>{item.muscle}</Text></View><Ionicons name="add-circle" size={25} color={colors.primary}/></Pressable>)}</Card> : null}
    </> : null}
    <ActionButton label="Guardar rutina" icon="save-outline" loading={saving} onPress={() => { void save(); }}/>
  </AppScrollView></Screen>;
}

function MiniCounter({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) { return <View style={styles.mini}><Text style={styles.miniLabel}>{label}</Text><View style={styles.miniControls}><Pressable onPress={() => onChange(Math.max(min, value - step))}><Ionicons name="remove-circle-outline" size={19} color={colors.textMuted}/></Pressable><Text style={styles.miniValue}>{value}</Text><Pressable onPress={() => onChange(Math.min(max, value + step))}><Ionicons name="add-circle-outline" size={19} color={colors.primary}/></Pressable></View></View>; }

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 86 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 29, fontWeight: '900' }, subtitle: { color: colors.textMuted, marginTop: 3 },
  label: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm }, input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSoft, paddingHorizontal: spacing.md, fontSize: 17, fontWeight: '700' }, restNotice: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, alignItems: 'center' }, restText: { color: colors.textMuted, flex: 1 },
  exerciseTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, position: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, positionText: { color: colors.primary, fontWeight: '900' }, thumb: { width: 66, height: 48 }, exerciseName: { color: colors.text, fontWeight: '800' }, muscle: { color: colors.textMuted, fontSize: 11, marginTop: 2 }, actions: { flexDirection: 'row', gap: spacing.md },
  configRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md }, mini: { flex: 1, backgroundColor: colors.backgroundSoft, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' }, miniLabel: { color: colors.textDim, fontSize: 9 }, miniControls: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }, miniValue: { color: colors.text, minWidth: 23, textAlign: 'center', fontWeight: '800', fontSize: 12 },
  addRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, addThumb: { width: 58, height: 42 }, addName: { color: colors.text, fontWeight: '700' },
});
