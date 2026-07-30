import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Exercise, MuscleGroup } from '../types';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';
import { ExerciseMedia } from './ExerciseMedia';

const DIACRITICS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');
const normalize = (value: string) => value.normalize('NFD').replace(DIACRITICS, '').toLowerCase();
type Filter = 'Todos' | 'Sugeridos' | MuscleGroup;

type Props = {
  visible: boolean;
  exercises: Exercise[];
  usedExerciseIds?: Set<string>;
  suggestedMuscles?: MuscleGroup[];
  onAdd: (exercise: Exercise) => void;
  onClose: () => void;
};

export function ExercisePickerSheet({
  visible,
  exercises,
  usedExerciseIds = new Set(),
  suggestedMuscles = [],
  onAdd,
  onClose,
}: Props) {
  const colors = useTheme();
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('Todos');

  useEffect(() => {
    if (!visible) return;
    setSearch('');
    setFilter(suggestedMuscles.length ? 'Sugeridos' : 'Todos');
  }, [visible]);

  const muscles = useMemo(
    () => [...new Set(exercises.map(item => item.muscle))].sort((a, b) => a.localeCompare(b)),
    [exercises],
  );
  const suggested = useMemo(() => new Set(suggestedMuscles), [suggestedMuscles]);
  const query = normalize(search);
  const filtered = exercises
    .filter(item => {
      if (filter === 'Todos') return true;
      if (filter === 'Sugeridos') return suggested.has(item.muscle);
      return item.muscle === filter;
    })
    .filter(item => !query || normalize(item.name).includes(query) || normalize(item.muscle).includes(query))
    .sort((a, b) => {
      const aUsed = usedExerciseIds.has(a.id) ? 1 : 0;
      const bUsed = usedExerciseIds.has(b.id) ? 1 : 0;
      return bUsed - aUsed || a.muscle.localeCompare(b.muscle) || a.name.localeCompare(b.name);
    });

  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Agregar ejercicios</Text>
              <Text style={styles.subtitle}>Busca por nombre o elige un grupo muscular.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar selector" style={styles.close} onPress={onClose}>
              <Ionicons name="close" size={23} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.search}>
            <Ionicons name="search-outline" size={20} color={colors.textDim} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Sentadilla, pecho, polea…"
              placeholderTextColor={colors.textDim}
              style={styles.searchInput}
              autoCorrect={false}
            />
            {search ? (
              <Pressable onPress={() => setSearch('')} hitSlop={10}>
                <Ionicons name="close-circle" size={20} color={colors.textDim} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {suggestedMuscles.length ? (
              <FilterChip label="Sugeridos" active={filter === 'Sugeridos'} onPress={() => setFilter('Sugeridos')} />
            ) : null}
            <FilterChip label="Todos" active={filter === 'Todos'} onPress={() => setFilter('Todos')} />
            {muscles.map(muscle => (
              <FilterChip key={muscle} label={muscle} active={filter === muscle} onPress={() => setFilter(muscle)} />
            ))}
          </ScrollView>

          <View style={styles.resultHeader}>
            <Text style={styles.resultCount}>{filtered.length} disponibles</Text>
            {filter === 'Sugeridos' ? <Text style={styles.resultHint}>Según los músculos de tu rutina</Text> : null}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={filtered.length ? styles.list : styles.emptyList}
            renderItem={({ item }) => (
              <Pressable style={styles.exerciseRow} onPress={() => onAdd(item)}>
                <ExerciseMedia mediaKey={item.mediaKey} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <View style={styles.exerciseMetaRow}>
                    <Text style={styles.exerciseMuscle}>{item.muscle}</Text>
                    {usedExerciseIds.has(item.id) ? <Text style={styles.familiar}>Ya lo usas</Text> : null}
                  </View>
                </View>
                <View style={styles.addIcon}><Ionicons name="add" size={22} color={colors.black} /></View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={32} color={colors.textDim} />
                <Text style={styles.emptyTitle}>No hay coincidencias</Text>
                <Text style={styles.emptyBody}>Prueba con otro nombre o cambia el grupo muscular.</Text>
              </View>
            }
          />

          <Pressable style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneText}>Listo</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
  sheet: {
    height: '88%', backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border, paddingTop: spacing.sm, overflow: 'hidden',
  },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  close: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  search: {
    minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg,
    marginTop: spacing.lg, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.backgroundSoft,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: spacing.sm },
  filters: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  filterChip: { minHeight: 38, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSoft },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoftBackground },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.primary },
  resultHeader: { minHeight: 32, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { color: colors.text, fontSize: 12, fontWeight: '800' },
  resultHint: { color: colors.textMuted, fontSize: 10 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  exerciseRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft },
  thumb: { width: 68, height: 50 },
  exerciseName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  exerciseMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  exerciseMuscle: { color: colors.textMuted, fontSize: 11 },
  familiar: { color: colors.primary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  addIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: spacing.md },
  emptyBody: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.xs },
  doneButton: { minHeight: 54, marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: colors.black, fontWeight: '900', fontSize: 16 },
}));
