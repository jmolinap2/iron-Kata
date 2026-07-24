import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  if (!session) return null;
  const grouped = Object.entries(session.sets.reduce<Record<string, typeof session.sets>>((acc, item) => { (acc[item.exerciseName] ??= []).push(item); return acc; }, {}));
  return <Screen><AppScrollView contentStyle={{ paddingTop: spacing.md }}>
    <View style={styles.topbar}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={25} color={colors.text}/></Pressable><View><Text style={styles.title}>{session.routineName}</Text><Text style={styles.subtitle}>{formatShortDate(session.completedAt ?? session.startedAt)}</Text></View></View>
    <Card style={styles.metrics}><View><Text style={styles.metricValue}>{grouped.length}</Text><Text style={styles.metricLabel}>ejercicios</Text></View><View><Text style={styles.metricValue}>{session.sets.length}</Text><Text style={styles.metricLabel}>series</Text></View><View><Text style={styles.metricValue}>{session.isQuick ? 'Rápido' : 'Secuencia'}</Text><Text style={styles.metricLabel}>tipo</Text></View></Card>
    {grouped.length ? grouped.map(([name, sets]) => <Card key={name}><Text style={styles.exerciseName}>{name}</Text>{sets.map(item => <View key={item.id} style={styles.setRow}><View style={styles.number}><Text style={styles.numberText}>{item.setNumber}</Text></View><Text style={styles.setText}>{formatWeight(item.weight)} kg</Text><Text style={styles.setText}>{item.reps} reps</Text><Ionicons name="checkmark-circle" size={20} color={colors.success}/></View>)}</Card>) : <Card><EmptyState icon="barbell-outline" title="Sesión sin series" body="Este registro corresponde a un día de descanso."/></Card>}
  </AppScrollView></Screen>;
}

const useStyles = createThemedStyleSheet(colors => ({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 86 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 26, fontWeight: '900' }, subtitle: { color: colors.textMuted, marginTop: 3 },
  metrics: { flexDirection: 'row', justifyContent: 'space-around' }, metricValue: { color: colors.primary, fontSize: 19, fontWeight: '900', textAlign: 'center' }, metricLabel: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 3 }, exerciseName: { color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: spacing.sm },
  setRow: { flexDirection: 'row', alignItems: 'center', minHeight: 50, gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, number: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' }, numberText: { color: colors.primary, fontWeight: '800' }, setText: { color: colors.text, flex: 1, fontWeight: '700' },
}));
