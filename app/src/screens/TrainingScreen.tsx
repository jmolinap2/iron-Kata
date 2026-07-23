import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, Header, Screen, SectionTitle } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function TrainingScreen() {
  const navigation = useNavigation<Navigation>();
  const routines = useAppStore(state => state.routines);
  const active = useAppStore(state => state.activeWorkout);

  return (
    <Screen>
      <AppScrollView>
        <Header title="Entreno" subtitle="Tu secuencia, siempre en el orden correcto." />
        {active ? <ActionButton label={`Continuar · ${active.routine.name}`} icon="arrow-forward" onPress={() => navigation.navigate('ActiveExercise')} /> : null}
        <View style={styles.quickRow}>
          <ActionButton label="Entrenamiento rápido" icon="flash" variant="outline" style={{ flex: 1 }} onPress={() => navigation.navigate('QuickWorkout')} />
        </View>
        <SectionTitle title="Secuencia activa" action="Crear rutina" onAction={() => navigation.navigate('RoutineEditor')} />
        {routines.map((routine, index) => (
          <Card key={routine.id} style={styles.routineCard} delay={index * 45}>
            <Pressable style={styles.routineTop} onPress={() => routine.isRest ? navigation.navigate('RoutineEditor', { routineId: routine.id }) : navigation.navigate('RoutineDetail', { routineId: routine.id })}>
              <View style={[styles.order, routine.isRest && styles.orderRest]}><Text style={styles.orderText}>{index + 1}</Text></View>
              {routine.exercises[0] ? <ExerciseMedia mediaKey={routine.exercises[0].mediaKey} style={styles.thumb} /> : <View style={[styles.thumb, styles.restThumb]}><Ionicons name="moon" size={28} color={colors.textDim} /></View>}
              <View style={{ flex: 1 }}>
                <Text style={styles.routineName}>{routine.name}</Text>
                <Text style={styles.meta}>{routine.isRest ? 'Recuperación programada' : `${routine.exercises.length} ejercicios · ${routine.exercises.reduce((sum, item) => sum + item.sets, 0)} series`}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textDim} />
            </Pressable>
            <Pressable style={styles.editLink} onPress={() => navigation.navigate('RoutineEditor', { routineId: routine.id })}>
              <Ionicons name="create-outline" size={16} color={colors.primary} /><Text style={styles.editText}>Editar</Text>
            </Pressable>
          </Card>
        ))}
      </AppScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row' },
  routineCard: { padding: spacing.md },
  routineTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  order: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  orderRest: { backgroundColor: colors.surfaceMuted },
  orderText: { color: colors.black, fontWeight: '900', fontSize: 16 },
  thumb: { width: 76, height: 56 },
  restThumb: { backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  routineName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  editLink: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.md, paddingHorizontal: spacing.sm },
  editText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
});
