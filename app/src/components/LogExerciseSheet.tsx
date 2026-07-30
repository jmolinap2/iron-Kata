import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Exercise, MuscleGroup } from '../types';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';
import { ExerciseMedia } from './ExerciseMedia';

const DIACRITICS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');
const normalize = (value: string) => value.normalize('NFD').replace(DIACRITICS, '').toLowerCase();
type Filter = 'Todos' | MuscleGroup;
export type QuickLoggedSet = { weight: number; reps: number };

type Props = {
  visible: boolean;
  exercises: Exercise[];
  lastValues: Record<string, QuickLoggedSet | undefined>;
  onAdd: (exercise: Exercise, sets: QuickLoggedSet[]) => void;
  onClose: () => void;
};

export function LogExerciseSheet({ visible, exercises, lastValues, onAdd, onClose }: Props) {
  const colors = useTheme();
  const styles = useStyles();
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('Todos');
  const [setCount, setSetCount] = useState(3);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(10);

  useEffect(() => {
    if (!visible) return;
    setSelected(null);
    setSearch('');
    setFilter('Todos');
  }, [visible]);

  const muscles = useMemo(
    () => [...new Set(exercises.map(item => item.muscle))].sort((a, b) => a.localeCompare(b)),
    [exercises],
  );
  const query = normalize(search);
  const filtered = exercises
    .filter(item => filter === 'Todos' || item.muscle === filter)
    .filter(item => !query || normalize(item.name).includes(query) || normalize(item.muscle).includes(query))
    .sort((a, b) => a.muscle.localeCompare(b.muscle) || a.name.localeCompare(b.name));

  const choose = (exercise: Exercise) => {
    const previous = lastValues[exercise.id];
    setSelected(exercise);
    setSetCount(3);
    setWeight(previous?.weight ?? 0);
    setReps(previous?.reps ?? 10);
  };

  const add = () => {
    if (!selected) return;
    onAdd(selected, Array.from({ length: setCount }, () => ({ weight, reps })));
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {selected ? (
            <>
              <View style={styles.header}>
                <Pressable accessibilityRole="button" accessibilityLabel="Volver a ejercicios" style={styles.close} onPress={() => setSelected(null)}>
                  <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Registrar ejercicio</Text>
                  <Text style={styles.subtitle}>Los valores se aplican a todas las series; luego puedes ajustar cada una.</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.close} onPress={onClose}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.configureContent}>
                <ExerciseMedia mediaKey={selected.mediaKey} animated style={styles.preview} />
                <View>
                  <Text style={styles.selectedName}>{selected.name}</Text>
                  <Text style={styles.selectedMuscle}>{selected.muscle}</Text>
                </View>

                {lastValues[selected.id] ? (
                  <View style={styles.previousHint}>
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                    <Text style={styles.previousText}>
                      Última vez: {lastValues[selected.id]!.weight} kg × {lastValues[selected.id]!.reps} reps
                    </Text>
                  </View>
                ) : null}

                <View style={styles.quickGrid}>
                  <QuickNumber label="Series" value={setCount} min={1} max={12} step={1} onChange={setSetCount} />
                  <QuickNumber label="Peso (kg)" value={weight} min={0} max={1000} step={2.5} decimal onChange={setWeight} />
                  <QuickNumber label="Repeticiones" value={reps} min={1} max={100} step={1} onChange={setReps} />
                </View>

                <View style={styles.previewSummary}>
                  <Text style={styles.previewLabel}>Se agregará</Text>
                  <Text style={styles.previewValue}>{setCount} series × {reps} reps · {weight} kg</Text>
                </View>
              </ScrollView>

              <Pressable style={styles.primaryButton} onPress={add}>
                <Ionicons name="add-circle" size={21} color={colors.black} />
                <Text style={styles.primaryText}>Agregar al entrenamiento</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>¿Qué ejercicio hiciste?</Text>
                  <Text style={styles.subtitle}>Filtra por músculo o busca por nombre.</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.close} onPress={onClose}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.search}>
                <Ionicons name="search-outline" size={20} color={colors.textDim} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar ejercicio o músculo"
                  placeholderTextColor={colors.textDim}
                  style={styles.searchInput}
                  autoCorrect={false}
                />
                {search ? <Pressable onPress={() => setSearch('')} hitSlop={10}><Ionicons name="close-circle" size={20} color={colors.textDim} /></Pressable> : null}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                <FilterChip label="Todos" active={filter === 'Todos'} onPress={() => setFilter('Todos')} />
                {muscles.map(muscle => <FilterChip key={muscle} label={muscle} active={filter === muscle} onPress={() => setFilter(muscle)} />)}
              </ScrollView>

              <Text style={styles.resultCount}>{filtered.length} ejercicios disponibles</Text>
              <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={filtered.length ? styles.list : styles.emptyList}
                renderItem={({ item }) => (
                  <Pressable style={styles.exerciseRow} onPress={() => choose(item)}>
                    <ExerciseMedia mediaKey={item.mediaKey} style={styles.thumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseName}>{item.name}</Text>
                      <Text style={styles.exerciseMuscle}>{item.muscle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Ionicons name="search-outline" size={32} color={colors.textDim} />
                    <Text style={styles.emptyTitle}>No encontramos ejercicios</Text>
                    <Text style={styles.emptyBody}>Cambia el filtro o prueba otra búsqueda.</Text>
                  </View>
                }
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function QuickNumber({
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
    <View style={styles.quickNumber}>
      <Text style={styles.quickLabel}>{label}</Text>
      <View style={styles.quickRow}>
        <Pressable style={styles.quickButton} onPress={() => changeBy(-step)}>
          <Ionicons name="remove" size={21} color={colors.textMuted} />
        </Pressable>
        <TextInput
          style={styles.quickInput}
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
        <Pressable style={styles.quickButton} onPress={() => changeBy(step)}>
          <Ionicons name="add" size={21} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = createThemedStyleSheet(colors => ({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2,3,4,0.72)' },
  sheet: { height: '90%', backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border, paddingTop: spacing.sm, overflow: 'hidden' },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  title: { color: colors.text, fontSize: 23, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  close: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  search: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.lg, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSoft },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: spacing.sm },
  filters: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  filterChip: { minHeight: 38, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSoft },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoftBackground },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.primary },
  resultCount: { color: colors.textMuted, fontSize: 11, fontWeight: '700', paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  exerciseRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft },
  thumb: { width: 68, height: 50 },
  exerciseName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  exerciseMuscle: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  empty: { alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: spacing.md },
  emptyBody: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  configureContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  preview: { width: '100%', aspectRatio: 1.6, marginTop: spacing.lg },
  selectedName: { color: colors.text, fontSize: 23, fontWeight: '900' },
  selectedMuscle: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 3 },
  previousHint: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primaryBorder, backgroundColor: colors.primarySoftBackground, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  previousText: { color: colors.textMuted, fontSize: 12, flex: 1 },
  quickGrid: { gap: spacing.sm },
  quickNumber: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSoft, padding: spacing.md },
  quickLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  quickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.sm },
  quickButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  quickInput: { minWidth: 86, color: colors.text, fontSize: 25, fontWeight: '900', textAlign: 'center', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.primaryBorder },
  previewSummary: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceRaised },
  previewLabel: { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', fontWeight: '800' },
  previewValue: { color: colors.primary, fontSize: 18, fontWeight: '900', marginTop: 5 },
  primaryButton: { minHeight: 56, marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  primaryText: { color: colors.black, fontWeight: '900', fontSize: 16 },
}));
