import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, AppScrollView, Card } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { CHANGELOG } from '../data/changelog';
import type { Exercise } from '../types';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';

export function WhatsNewScreen({ sinceVersion, exercises, onDismiss }: { sinceVersion: number; exercises: Exercise[]; onDismiss: () => void }) {
  const colors = useTheme();
  const styles = useStyles();
  const entries = CHANGELOG.filter(item => item.version > sinceVersion);
  const nameOf = (mediaKey: string) => exercises.find(item => item.mediaKey === mediaKey)?.name ?? mediaKey;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AppScrollView contentStyle={{ paddingTop: spacing.xl }}>
        <View style={styles.badge}><Ionicons name="sparkles" size={26} color={colors.primary} /></View>
        <Text style={styles.title}>Novedades</Text>
        <Text style={styles.subtitle}>Esto cambió desde la última vez que abriste Iron Kata.</Text>

        {entries.map(entry => (
          <Card key={entry.version}>
            <Text style={styles.entryDate}>{entry.date}</Text>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            <Text style={styles.entrySummary}>{entry.summary}</Text>
            {entry.newExerciseKeys?.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow} contentContainerStyle={{ gap: spacing.md }}>
                {entry.newExerciseKeys.map(key => (
                  <View key={key} style={styles.thumbItem}>
                    <ExerciseMedia mediaKey={key} animated style={styles.thumb} />
                    <Text numberOfLines={2} style={styles.thumbLabel}>{nameOf(key)}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </Card>
        ))}

        <ActionButton label="Continuar" icon="arrow-forward" onPress={onDismiss} />
      </AppScrollView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyleSheet(colors => ({
  screen: { flex: 1, backgroundColor: colors.background },
  badge: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: spacing.sm, marginBottom: spacing.lg },
  entryDate: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  entryTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 3 },
  entrySummary: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: spacing.sm },
  thumbRow: { marginTop: spacing.lg },
  thumbItem: { width: 96 },
  thumb: { width: 96, height: 96 },
  thumbLabel: { color: colors.textMuted, fontSize: 10, marginTop: spacing.xs, lineHeight: 13 },
}));
