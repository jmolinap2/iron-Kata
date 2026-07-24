import { useMemo } from 'react';
import { Alert, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import type { RootStackParamList } from '../navigation/types';
import { heroPull } from '../media';
import { ActionButton, AppScrollView, Card, Header, Pill, Screen, SectionTitle } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { selectRecommendedRoutine, useAppStore, weekSessions } from '../store/useAppStore';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';
import { formatDay, formatLongDate } from '../utils/format';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const colors = useTheme();
  const styles = useStyles();
  const profile = useAppStore(state => state.profile);
  const recommended = useAppStore(selectRecommendedRoutine);
  const sessions = useAppStore(state => state.sessions);
  const week = useMemo(() => weekSessions(sessions).slice(0, 3), [sessions]);
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const completeRest = useAppStore(state => state.completeRest);
  const lastCompleted = sessions.find(item => item.status === 'completed' && !item.isQuick);

  const openPrimary = async () => {
    if (activeWorkout) {
      navigation.navigate('ActiveExercise');
      return;
    }
    if (!recommended) return;
    if (recommended.isRest) {
      await completeRest(recommended.id);
      Alert.alert('Descanso registrado', 'La secuencia avanzó al siguiente entrenamiento pendiente.');
      return;
    }
    navigation.navigate('RoutineDetail', { routineId: recommended.id });
  };

  const explanation = lastCompleted
    ? `Tu última sesión fue ${lastCompleted.routineName}. Continuamos con el siguiente bloque pendiente de tu secuencia.`
    : 'Empiezas por el primer bloque de tu secuencia. Al terminarlo, la aplicación recordará exactamente cuál sigue.';

  return (
    <Screen>
      <AppScrollView>
        <Header
          title={`Hola, ${profile.name}`}
          subtitle={formatLongDate()}
          right={<Pill icon="flame" label={String(week.length)} />}
        />

        <Card style={styles.heroCard} delay={40}>
          <ImageBackground source={heroPull} style={styles.heroImage} imageStyle={styles.heroImageStyle} resizeMode="cover">
            <LinearGradient colors={[colors.heroOverlayStart, colors.heroOverlayMiddle, 'rgba(0,0,0,0.04)']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
            <View style={styles.heroContent}>
              <Text style={styles.eyebrow}>{activeWorkout ? 'ENTRENAMIENTO EN CURSO' : 'HOY TE TOCA'}</Text>
              <Text style={styles.heroTitle}>{activeWorkout?.routine.name ?? recommended?.name ?? 'Configura tu rutina'}</Text>
              <View style={styles.accentLine} />
              <Text style={styles.heroBody}>{recommended?.isRest ? 'Recupérate hoy para continuar con fuerza.' : 'Tu siguiente bloque pendiente, listo para empezar.'}</Text>
            </View>
          </ImageBackground>
        </Card>

        <Card delay={90}>
          <SectionTitle title="Tu semana" />
          <View style={styles.divider} />
          {week.length ? week.map((item, index) => (
            <Pressable key={item.id} style={[styles.weekRow, index < week.length - 1 && styles.rowBorder]} onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}>
              <View style={styles.check}><Ionicons name="checkmark" size={18} color={colors.black} /></View>
              <Text style={styles.day}>{formatDay(item.completedAt ?? item.startedAt)}</Text>
              <Text style={styles.routineName}>{item.routineName}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </Pressable>
          )) : (
            <View style={styles.emptyWeek}>
              <Ionicons name="calendar-outline" size={22} color={colors.textDim} />
              <Text style={styles.emptyWeekText}>Aún no hay entrenamientos esta semana.</Text>
            </View>
          )}
        </Card>

        <Card style={styles.recommendation} delay={130}>
          <View style={styles.bulb}><Ionicons name="bulb-outline" size={29} color={colors.warning} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recommendationTitle}>Por qué esta recomendación</Text>
            <Text style={styles.recommendationBody}>{explanation}</Text>
          </View>
        </Card>

        <ActionButton
          label={activeWorkout ? 'Continuar entrenamiento' : recommended?.isRest ? 'Completar día de descanso' : 'Comenzar entrenamiento'}
          icon={activeWorkout ? 'arrow-forward' : recommended?.isRest ? 'moon' : 'play'}
          onPress={() => { void openPrimary(); }}
        />

        {recommended && !recommended.isRest ? (
          <>
            <SectionTitle title="Primeros ejercicios" action="Ver rutina completa" onAction={() => navigation.navigate('RoutineDetail', { routineId: recommended.id })} />
            <Card style={styles.exerciseList}>
              {recommended.exercises.slice(0, 3).map((item, index) => (
                <Pressable key={item.id} style={[styles.exerciseRow, index < 2 && styles.rowBorder]} onPress={() => navigation.navigate('RoutineDetail', { routineId: recommended.id })}>
                  <ExerciseMedia mediaKey={item.mediaKey} style={styles.thumbnail} />
                  <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseMeta}>{item.sets} series  •  {item.repMin}–{item.repMax} repeticiones</Text>
                  </View>
                  <Ionicons name="play-circle-outline" size={24} color={colors.textDim} />
                </Pressable>
              ))}
            </Card>
          </>
        ) : null}
      </AppScrollView>
    </Screen>
  );
}

const useStyles = createThemedStyleSheet(colors => ({
  heroCard: { padding: 0, height: 272, borderColor: colors.primaryBorder },
  heroImage: { flex: 1 }, heroImageStyle: { borderRadius: radius.lg },
  heroContent: { width: '66%', height: '100%', justifyContent: 'center', padding: spacing.xl },
  eyebrow: { color: colors.primary, fontWeight: '800', fontSize: 14, letterSpacing: 0.6 },
  heroTitle: { color: colors.text, fontSize: 36, fontWeight: '900', lineHeight: 40, marginTop: spacing.md, letterSpacing: -1 },
  accentLine: { width: 48, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginVertical: spacing.lg },
  heroBody: { color: colors.textOnImage, fontSize: 14, lineHeight: 20 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: spacing.md },
  weekRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  check: { width: 31, height: 31, borderRadius: 16, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  day: { color: colors.textMuted, width: 76, fontSize: 14 },
  routineName: { color: colors.text, fontSize: 15, fontWeight: '700', flex: 1 },
  emptyWeek: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyWeekText: { color: colors.textMuted, fontSize: 14 },
  recommendation: { flexDirection: 'row', gap: spacing.lg, backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
  bulb: { width: 50, height: 50, borderRadius: 15, backgroundColor: colors.warningSurface, borderWidth: 1, borderColor: colors.warningBorder, alignItems: 'center', justifyContent: 'center' },
  recommendationTitle: { color: colors.warning, fontSize: 14, fontWeight: '800', marginBottom: 3 },
  recommendationBody: { color: colors.text, fontSize: 14, lineHeight: 20 },
  exerciseList: { padding: 0 },
  exerciseRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.md },
  thumbnail: { width: 78, height: 54 },
  number: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: colors.primary, fontWeight: '800' },
  exerciseName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  exerciseMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
}));
