import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, Screen, SectionTitle } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { useAppStore } from '../store/useAppStore';
import type { Exercise, MuscleGroup, PlannedExercise, Routine } from '../types';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';

const DIACRITICS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');
const normalize = (value: string) => value.normalize('NFD').replace(DIACRITICS, '').toLowerCase();

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
  const [draft, setDraft] = useState<Routine>(() => source ? JSON.parse(JSON.stringify(source)) : {
    id: `custom-${Date.now()}`, name: 'Mi rutina', orderIndex: routines.length,
    muscles: [], isRest: false, active: true, exercises: [],
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  const updateExercise = (index: number, patch: Partial<PlannedExercise>) => setDraft(value => ({ ...value, exercises: value.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  const move = (index: number, direction: -1 | 1) => setDraft(value => {
    const target = index + direction; if (target < 0 || target >= value.exercises.length) return value;
    const exercises = [...value.exercises]; [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
    return { ...value, exercises };
  });
  const remove = (index: number) => setDraft(value => ({ ...value, exercises: value.exercises.filter((_, itemIndex) => itemIndex !== index) }));
  const add = (item: Exercise) => setDraft(value => ({ ...value, exercises: [...value.exercises, { ...item, routineId: value.id, position: value.exercises.length, sets: 3, repMin: 8, repMax: 12, restSeconds: 90, lastWeight: null }] }));

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

  const removeRoutine = () => Alert.alert('Eliminar rutina', `Se borrará "${draft.name}" y su historial de ejercicios asociados. Esta acción no se puede deshacer.`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => { void deleteRoutine(draft.id).then(() => navigation.goBack()); } },
  ]);

  const usedElsewhere = useMemo(() => new Set(routines.flatMap(routine => routine.exercises.map(item => item.id))), [routines]);
  const query = normalize(search);
  const available = allExercises
    .filter(item => !draft.exercises.some(selected => selected.id === item.id))
    .filter(item => !query || normalize(item.name).includes(query) || normalize(item.muscle).includes(query));

  const orderQuery = normalize(orderSearch);
  const visibleOrderIndices = draft.exercises
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !orderQuery || normalize(item.name).includes(orderQuery) || normalize(item.muscle).includes(orderQuery))
    .map(({ index }) => index);
  return <Screen><AppScrollView contentStyle={{ paddingTop: spacing.md }}>
    <View style={styles.topbar}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={25} color={colors.text}/></Pressable><View><Text style={styles.title}>{source ? 'Editar rutina' : 'Crear rutina'}</Text><Text style={styles.subtitle}>Orden y objetivos simples.</Text></View></View>
    <Card><Text style={styles.label}>Nombre</Text><TextInput style={styles.input} value={draft.name} onChangeText={name => setDraft(value => ({ ...value, name }))}/>{draft.isRest ? <View style={styles.restNotice}><Ionicons name="moon" size={22} color={colors.primary}/><Text style={styles.restText}>Este bloque marca un descanso dentro de la secuencia.</Text></View> : null}</Card>
    {!draft.isRest ? <>
      <SectionTitle title="Ejercicios en orden" />
      {draft.exercises.length > 5 ? (
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.textDim} />
          <TextInput style={styles.searchInput} value={orderSearch} onChangeText={setOrderSearch} placeholder="Buscar en esta rutina" placeholderTextColor={colors.textDim} />
          {orderSearch ? <Pressable onPress={() => setOrderSearch('')} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.textDim} /></Pressable> : null}
        </View>
      ) : null}
      {visibleOrderIndices.map(index => {
        const item = draft.exercises[index];
        return <Card key={item.id} style={{ padding: spacing.md }}>
          <View style={styles.exerciseTop}><View style={styles.position}><Text style={styles.positionText}>{index + 1}</Text></View><ExerciseMedia mediaKey={item.mediaKey} style={styles.thumb}/><View style={{ flex: 1 }}><Text style={styles.exerciseName}>{item.name}</Text><Text style={styles.muscle}>{item.muscle}</Text></View><View style={styles.actions}>{!orderQuery ? <>
            <Pressable onPress={() => move(index, -1)} disabled={index === 0}><Ionicons name="arrow-up" size={20} color={index === 0 ? colors.textDim : colors.primary}/></Pressable>
            <Pressable onPress={() => move(index, 1)} disabled={index === draft.exercises.length - 1}><Ionicons name="arrow-down" size={20} color={index === draft.exercises.length - 1 ? colors.textDim : colors.primary}/></Pressable>
          </> : null}<Pressable onPress={() => remove(index)}><Ionicons name="trash-outline" size={20} color={colors.danger}/></Pressable></View></View>
          <View style={styles.configRow}><MiniCounter label="Series" value={item.sets} min={1} max={8} step={1} onChange={sets => updateExercise(index, { sets })}/><MiniCounter label="Rep mín." value={item.repMin} min={1} max={30} step={1} onChange={repMin => updateExercise(index, { repMin, repMax: Math.max(repMin, item.repMax) })}/><MiniCounter label="Rep máx." value={item.repMax} min={item.repMin} max={40} step={1} onChange={repMax => updateExercise(index, { repMax })}/><MiniCounter label="Descanso" value={item.restSeconds} min={30} max={300} step={15} onChange={restSeconds => updateExercise(index, { restSeconds })}/></View>
        </Card>;
      })}
      <Card>
        <SectionTitle title="Añadir ejercicio" />
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.textDim} />
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Buscar por nombre o músculo" placeholderTextColor={colors.textDim} />
          {search ? <Pressable onPress={() => setSearch('')} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.textDim} /></Pressable> : null}
        </View>
        {available.length ? available.map(item => (
          <Pressable key={item.id} style={styles.addRow} onPress={() => add(item)}>
            <ExerciseMedia mediaKey={item.mediaKey} style={styles.addThumb}/>
            <View style={{ flex: 1 }}>
              <View style={styles.addNameRow}>
                <Text style={styles.addName}>{item.name}</Text>
                {!usedElsewhere.has(item.id) ? <View style={styles.unusedPill}><Text style={styles.unusedPillText}>Sin usar</Text></View> : null}
              </View>
              <Text style={styles.muscle}>{item.muscle}</Text>
            </View>
            <Ionicons name="add-circle" size={25} color={colors.primary}/>
          </Pressable>
        )) : <Text style={styles.noResults}>{search ? `Ningún ejercicio coincide con "${search}".` : 'Ya agregaste todos los ejercicios disponibles.'}</Text>}
      </Card>
    </> : null}
    <ActionButton label="Guardar rutina" icon="save-outline" loading={saving} onPress={() => { void save(); }}/>
    {source ? <Pressable style={styles.deleteRoutine} onPress={removeRoutine}><Ionicons name="trash-outline" size={18} color={colors.danger} /><Text style={styles.deleteRoutineText}>Eliminar rutina</Text></Pressable> : null}
  </AppScrollView></Screen>;
}

function MiniCounter({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) { const colors = useTheme(); const styles = useStyles(); return <View style={styles.mini}><Text style={styles.miniLabel}>{label}</Text><View style={styles.miniControls}><Pressable onPress={() => onChange(Math.max(min, value - step))}><Ionicons name="remove-circle-outline" size={19} color={colors.textMuted}/></Pressable><Text style={styles.miniValue}>{value}</Text><Pressable onPress={() => onChange(Math.min(max, value + step))}><Ionicons name="add-circle-outline" size={19} color={colors.primary}/></Pressable></View></View>; }

const useStyles = createThemedStyleSheet(colors => ({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 86 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 29, fontWeight: '900' }, subtitle: { color: colors.textMuted, marginTop: 3 },
  label: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm }, input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSoft, paddingHorizontal: spacing.md, fontSize: 17, fontWeight: '700' }, restNotice: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, alignItems: 'center' }, restText: { color: colors.textMuted, flex: 1 },
  exerciseTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, position: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, positionText: { color: colors.primary, fontWeight: '900' }, thumb: { width: 66, height: 48 }, exerciseName: { color: colors.text, fontWeight: '800' }, muscle: { color: colors.textMuted, fontSize: 11, marginTop: 2 }, actions: { flexDirection: 'row', gap: spacing.md },
  configRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md }, mini: { flex: 1, backgroundColor: colors.backgroundSoft, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' }, miniLabel: { color: colors.textDim, fontSize: 9 }, miniControls: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }, miniValue: { color: colors.text, minWidth: 23, textAlign: 'center', fontWeight: '800', fontSize: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSoft, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: spacing.sm },
  noResults: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: spacing.lg },
  addRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, addThumb: { width: 58, height: 42 }, addName: { color: colors.text, fontWeight: '700' },
  addNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unusedPill: { backgroundColor: colors.warningSurface, borderWidth: 1, borderColor: colors.warningBorder, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  unusedPillText: { color: colors.warning, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  deleteRoutine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 50, marginTop: spacing.sm }, deleteRoutineText: { color: colors.danger, fontWeight: '700' },
}));
