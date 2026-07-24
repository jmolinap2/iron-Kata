import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, Screen } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { createThemedStyleSheet, spacing, useTheme } from '../theme';
import { formatWeight } from '../utils/format';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function WorkoutSummaryScreen() {
  const navigation = useNavigation<Navigation>();
  const colors = useTheme();
  const styles = useStyles();
  const summary = useAppStore(state => state.lastSummary);
  const clearSummary = useAppStore(state => state.clearSummary);

  if (!summary) return null;
  const exercises = new Set(summary.session.sets.map(item => item.exerciseId)).size;
  const elapsed = Math.max(1, Math.round((new Date(summary.session.completedAt!).getTime() - new Date(summary.session.startedAt).getTime()) / 60000));

  const close = () => {
    clearSummary();
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  return (
    <Screen>
      <AppScrollView contentStyle={styles.content}>
        <View style={styles.celebration}>
          <LottieView source={require('../../assets/lottie/success.json')} autoPlay loop={false} style={styles.lottie} />
          <View style={styles.checkOverlay}><Ionicons name="checkmark" size={50} color={colors.black} /></View>
        </View>
        <Text style={styles.title}>¡Entrenamiento completado!</Text>
        <Text style={styles.subtitle}>{summary.session.routineName}</Text>

        <Card style={styles.metrics}>
          <SummaryMetric icon="barbell-outline" value={String(exercises)} label="Ejercicios" />
          <SummaryMetric icon="layers-outline" value={String(summary.session.sets.length)} label="Series" />
          <SummaryMetric icon="time-outline" value={`${elapsed} min`} label="Tiempo" />
        </Card>

        {summary.newRecords.length ? (
          <Card style={styles.records}>
            <View style={styles.recordHeader}><Ionicons name="trophy" size={26} color={colors.warning} /><Text style={styles.recordTitle}>Nuevos récords personales</Text></View>
            {summary.newRecords.map(record => (
              <View key={record.id} style={styles.recordRow}>
                <View style={{ flex: 1 }}><Text style={styles.recordName}>{record.exerciseName}</Text><Text style={styles.recordMeta}>{formatWeight(record.weight)} kg × {record.reps} repeticiones</Text></View>
                <View><Text style={styles.e1rm}>{formatWeight(record.estimatedOneRepMax)} kg</Text><Text style={styles.e1rmLabel}>1RM estimado</Text></View>
              </View>
            ))}
          </Card>
        ) : null}

        <Text style={styles.nextHint}>Tu secuencia quedó actualizada. La próxima vez verás automáticamente el siguiente bloque pendiente.</Text>
        <ActionButton label="Finalizar entrenamiento" icon="checkmark" onPress={close} />
      </AppScrollView>
    </Screen>
  );
}

function SummaryMetric({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  const colors = useTheme();
  const styles = useStyles();
  return <View style={styles.metric}><Ionicons name={icon} size={25} color={colors.primary} /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const useStyles = createThemedStyleSheet(colors => ({
  content: { alignItems: 'stretch', paddingTop: spacing.xl },
  celebration: { alignSelf: 'center', width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  lottie: { width: 150, height: 150 },
  checkOverlay: { position: 'absolute', width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.primary, fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: 5 },
  metrics: { flexDirection: 'row', paddingVertical: spacing.xl },
  metric: { flex: 1, alignItems: 'center', gap: 5 }, metricValue: { color: colors.text, fontSize: 21, fontWeight: '900' }, metricLabel: { color: colors.textMuted, fontSize: 11 },
  records: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }, recordTitle: { color: colors.warning, fontSize: 17, fontWeight: '800' },
  recordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.warningBorder },
  recordName: { color: colors.text, fontWeight: '800' }, recordMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  e1rm: { color: colors.warning, fontSize: 17, fontWeight: '900', textAlign: 'right' }, e1rmLabel: { color: colors.textDim, fontSize: 10 },
  nextHint: { color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.xl },
}));
