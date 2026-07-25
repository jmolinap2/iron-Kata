import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import type { RootStackParamList } from '../navigation/types';
import { AppScrollView, Card, EmptyState, Screen } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { createThemedStyleSheet, spacing, useTheme } from '../theme';
import { formatShortDate, formatWeight } from '../utils/format';

export function SessionDetailScreen() {
  const navigation = useNavigation(); const route = useRoute<RouteProp<RootStackParamList, 'SessionDetail'>>();
  const colors = useTheme();
  const styles = useStyles();
  const session = useAppStore(state => state.sessions.find(item => item.id === route.params.sessionId));
  const updateSet = useAppStore(state => state.updateSet);
  const deleteSet = useAppStore(state => state.deleteSet);
  const deleteSession = useAppStore(state => state.deleteSession);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!session) return null;
  const grouped = Object.entries(session.sets.reduce<Record<string, typeof session.sets>>((acc, item) => { (acc[item.exerciseName] ??= []).push(item); return acc; }, {}));

  const removeSet = (id: string) => Alert.alert('Eliminar serie', '¿Quitar esta serie del registro?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => { void deleteSet(id); } },
  ]);

  const removeSession = () => Alert.alert('Eliminar sesión', 'Se borrará todo el registro de este entrenamiento. Esta acción no se puede deshacer.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => { void deleteSession(session.id).then(() => navigation.goBack()); } },
  ]);

  return <Screen><AppScrollView contentStyle={{ paddingTop: spacing.md }}>
    <View style={styles.topbar}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={25} color={colors.text}/></Pressable><View><Text style={styles.title}>{session.routineName}</Text><Text style={styles.subtitle}>{formatShortDate(session.completedAt ?? session.startedAt)}</Text></View></View>
    <Card style={styles.metrics}><View><Text style={styles.metricValue}>{grouped.length}</Text><Text style={styles.metricLabel}>ejercicios</Text></View><View><Text style={styles.metricValue}>{session.sets.length}</Text><Text style={styles.metricLabel}>series</Text></View><View><Text style={styles.metricValue}>{session.isQuick ? 'Rápido' : 'Secuencia'}</Text><Text style={styles.metricLabel}>tipo</Text></View></Card>
    {grouped.length ? grouped.map(([name, sets]) => <Card key={name}><Text style={styles.exerciseName}>{name}</Text>{sets.map(item => (
      <View key={item.id} style={styles.setRow}>
        <View style={styles.number}><Text style={styles.numberText}>{item.setNumber}</Text></View>
        {editingId === item.id ? <>
          <MiniStepper value={item.weight} step={2.5} min={0} format={formatWeight} onChange={weight => { void updateSet(item.id, weight, item.reps); }} />
          <MiniStepper value={item.reps} step={1} min={1} onChange={reps => { void updateSet(item.id, item.weight, reps); }} />
          <Pressable onPress={() => setEditingId(null)} hitSlop={8}><Ionicons name="checkmark-circle" size={22} color={colors.success} /></Pressable>
        </> : <>
          <Text style={styles.setText}>{formatWeight(item.weight)} kg</Text>
          <Text style={styles.setText}>{item.reps} reps</Text>
          <Pressable onPress={() => setEditingId(item.id)} hitSlop={8}><Ionicons name="create-outline" size={19} color={colors.primary} /></Pressable>
          <Pressable onPress={() => removeSet(item.id)} hitSlop={8}><Ionicons name="trash-outline" size={19} color={colors.danger} /></Pressable>
        </>}
      </View>
    ))}</Card>) : <Card><EmptyState icon="barbell-outline" title="Sesión sin series" body="Este registro corresponde a un día de descanso."/></Card>}
    <Pressable style={styles.deleteSession} onPress={removeSession}><Ionicons name="trash-outline" size={18} color={colors.danger} /><Text style={styles.deleteSessionText}>Eliminar sesión completa</Text></Pressable>
  </AppScrollView></Screen>;
}

function MiniStepper({ value, step, min, format, onChange }: { value: number; step: number; min: number; format?: (value: number) => string; onChange: (value: number) => void }) {
  const colors = useTheme();
  const styles = useStyles();
  return <View style={styles.miniStepper}>
    <Pressable onPress={() => onChange(Math.max(min, value - step))}><Ionicons name="remove-circle-outline" size={18} color={colors.textMuted} /></Pressable>
    <Text style={styles.miniStepperValue}>{format ? format(value) : value}</Text>
    <Pressable onPress={() => onChange(value + step)}><Ionicons name="add-circle-outline" size={18} color={colors.primary} /></Pressable>
  </View>;
}

const useStyles = createThemedStyleSheet(colors => ({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 86 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 26, fontWeight: '900' }, subtitle: { color: colors.textMuted, marginTop: 3 },
  metrics: { flexDirection: 'row', justifyContent: 'space-around' }, metricValue: { color: colors.primary, fontSize: 19, fontWeight: '900', textAlign: 'center' }, metricLabel: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 3 }, exerciseName: { color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: spacing.sm },
  setRow: { flexDirection: 'row', alignItems: 'center', minHeight: 50, gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, number: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' }, numberText: { color: colors.primary, fontWeight: '800' }, setText: { color: colors.text, flex: 1, fontWeight: '700' },
  miniStepper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }, miniStepperValue: { color: colors.text, minWidth: 44, textAlign: 'center', fontWeight: '800' },
  deleteSession: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 50, marginTop: spacing.sm }, deleteSessionText: { color: colors.danger, fontWeight: '700' },
}));
