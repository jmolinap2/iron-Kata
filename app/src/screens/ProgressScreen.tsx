import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import type { RootStackParamList } from '../navigation/types';
import { AppScrollView, Card, EmptyState, Header, ProgressBar, Screen, SectionTitle } from '../components/ui';
import { useAppStore, weekSessions } from '../store/useAppStore';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';
import { formatDay, formatShortDate, formatWeight } from '../utils/format';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ProgressScreen() {
  const navigation = useNavigation<Navigation>();
  const colors = useTheme();
  const styles = useStyles();
  const sessions = useAppStore(state => state.sessions);
  const week = useMemo(() => weekSessions(sessions), [sessions]);
  const routines = useAppStore(state => state.routines);
  const weights = useAppStore(state => state.weights);
  const records = useAppStore(state => state.records);
  const addBodyWeight = useAppStore(state => state.addBodyWeight);
  const [weightInput, setWeightInput] = useState('');
  const { width } = useWindowDimensions();

  const volumes = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of week) {
      for (const set of session.sets) {
        const planned = routines.flatMap(routine => routine.exercises).find(item => item.id === set.exerciseId);
        const muscle = planned?.muscle ?? 'Otros';
        map.set(muscle, (map.get(muscle) ?? 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [routines, week]);
  const maxVolume = Math.max(1, ...volumes.map(([, value]) => value));

  const saveWeight = async () => {
    const value = Number(weightInput.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) { Alert.alert('Peso inválido', 'Escribe un peso corporal válido.'); return; }
    await addBodyWeight(value);
    setWeightInput('');
  };

  return (
    <Screen>
      <AppScrollView>
        <Header title="Progreso" subtitle="Tu evolución, semana a semana." />
        <Card>
          <SectionTitle title="Historial de entrenamientos" />
          {week.length ? week.map(item => (
            <Pressable key={item.id} style={styles.historyRow} onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}>
              <View style={styles.check}><Ionicons name="checkmark" size={17} color={colors.black} /></View>
              <View style={{ width: 88 }}><Text style={styles.day}>{formatDay(item.completedAt ?? item.startedAt)}</Text><Text style={styles.date}>{formatShortDate(item.completedAt ?? item.startedAt)}</Text></View>
              <Text style={styles.historyName}>{item.routineName}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
            </Pressable>
          )) : <EmptyState icon="calendar-outline" title="Semana sin sesiones" body="Cuando completes tu primera rutina aparecerá aquí." />}
        </Card>

        <Card>
          <SectionTitle title="Músculos entrenados esta semana" />
          <Text style={styles.cardSubtitle}>Volumen por grupo muscular</Text>
          {volumes.length ? <View style={styles.volumeGrid}>{volumes.map(([muscle, sets]) => (
            <View key={muscle} style={styles.volumeItem}><View style={styles.volumeHeader}><Text style={styles.volumeName}>{muscle}</Text><Text style={styles.volumeSets}>{sets} series</Text></View><ProgressBar progress={sets / maxVolume} color={sets < maxVolume * 0.6 ? colors.warning : colors.primary} /></View>
          ))}</View> : <EmptyState icon="barbell-outline" title="Sin volumen registrado" body="Completa series para ver la distribución semanal." />}
        </Card>

        <Card>
          <View style={styles.weightHeader}><View><Text style={styles.sectionLabel}>Peso corporal</Text><Text style={styles.currentWeight}>{weights[0] ? `${formatWeight(weights[0].weight)} kg` : 'Sin datos'}</Text></View><Ionicons name="analytics-outline" size={28} color={colors.primary} /></View>
          <WeightChart values={weights.slice(0, 7).reverse().map(item => item.weight)} width={Math.max(260, width - 68)} />
          <View style={styles.inputRow}><TextInput value={weightInput} onChangeText={setWeightInput} keyboardType="decimal-pad" placeholder="76.8" placeholderTextColor={colors.textDim} style={styles.input} /><Pressable onPress={() => { void saveWeight(); }} style={styles.addButton}><Ionicons name="add" size={24} color={colors.black} /><Text style={styles.addButtonText}>Registrar</Text></Pressable></View>
        </Card>

        <Card>
          <SectionTitle title="Récords personales" />
          {records.length ? records.slice(0, 5).map(record => (
            <View key={record.id} style={styles.recordRow}><Ionicons name="trophy-outline" size={22} color={colors.warning} /><View style={{ flex: 1 }}><Text style={styles.recordName}>{record.exerciseName}</Text><Text style={styles.recordMeta}>{formatWeight(record.weight)} kg × {record.reps}</Text></View><View><Text style={styles.recordValue}>{formatWeight(record.estimatedOneRepMax)} kg</Text><Text style={styles.recordLabel}>1RM estimado</Text></View></View>
          )) : <EmptyState icon="trophy-outline" title="Tus récords aparecerán aquí" body="Se calculan al guardar series con peso y repeticiones." />}
        </Card>
      </AppScrollView>
    </Screen>
  );
}

function WeightChart({ values, width }: { values: number[]; width: number }) {
  const colors = useTheme();
  const styles = useStyles();
  const height = 130;
  if (values.length < 2) return <View style={styles.chartEmpty}><Text style={styles.chartEmptyText}>Registra al menos dos pesos para ver la tendencia.</Text></View>;
  const min = Math.min(...values) - 0.5; const max = Math.max(...values) + 0.5; const range = Math.max(1, max - min);
  const points = values.map((value, index) => ({ x: 10 + index * ((width - 20) / (values.length - 1)), y: 12 + (max - value) / range * (height - 28) }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const area = `${line} L ${points.at(-1)!.x} ${height} L ${points[0].x} ${height} Z`;
  return <Svg width={width} height={height}><Defs><SvgGradient id="weight" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={colors.primary} stopOpacity="0.38"/><Stop offset="1" stopColor={colors.primary} stopOpacity="0"/></SvgGradient></Defs><Path d={area} fill="url(#weight)"/><Path d={line} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

const useStyles = createThemedStyleSheet(colors => ({
  historyRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  check: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  day: { color: colors.text, fontSize: 14 }, date: { color: colors.textMuted, fontSize: 11, marginTop: 2 }, historyName: { color: colors.text, fontSize: 15, fontWeight: '800', flex: 1 },
  cardSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 3 }, volumeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  volumeItem: { width: '48%', backgroundColor: colors.surfaceRaised, padding: spacing.md, borderRadius: radius.md, gap: spacing.sm }, volumeHeader: { flexDirection: 'row', justifyContent: 'space-between' }, volumeName: { color: colors.text, fontWeight: '700', fontSize: 13 }, volumeSets: { color: colors.textMuted, fontSize: 11 },
  weightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionLabel: { color: colors.text, fontSize: 18, fontWeight: '800' }, currentWeight: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: spacing.sm },
  chartEmpty: { height: 115, alignItems: 'center', justifyContent: 'center' }, chartEmptyText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  inputRow: { flexDirection: 'row', gap: spacing.sm }, input: { flex: 1, minHeight: 48, color: colors.text, backgroundColor: colors.backgroundSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 17 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg }, addButtonText: { color: colors.black, fontWeight: '900' },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 62, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, recordName: { color: colors.text, fontWeight: '700' }, recordMeta: { color: colors.textMuted, fontSize: 11 }, recordValue: { color: colors.warning, fontWeight: '900', textAlign: 'right' }, recordLabel: { color: colors.textDim, fontSize: 9 },
}));
