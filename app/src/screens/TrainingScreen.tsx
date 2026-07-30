import { useRef, useState } from 'react';
import { Alert, Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Reanimated, { Easing, LinearTransition } from 'react-native-reanimated';

import type { RootStackParamList } from '../navigation/types';
import { ActionButton, AppScrollView, Card, Header, Screen } from '../components/ui';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { LongPressDragArea } from '../components/LongPressDragArea';
import { useAppStore } from '../store/useAppStore';
import type { Routine } from '../types';
import { createThemedStyleSheet, radius, spacing, useTheme } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const REORDER_TRANSITION = LinearTransition.duration(300).easing(Easing.bezier(0.2, 0.8, 0.2, 1));

export function TrainingScreen() {
  const navigation = useNavigation<Navigation>();
  const colors = useTheme();
  const styles = useStyles();
  const routines = useAppStore(state => state.routines);
  const active = useAppStore(state => state.activeWorkout);
  const reorderRoutines = useAppStore(state => state.reorderRoutines);
  const deleteRoutine = useAppStore(state => state.deleteRoutine);
  const [moving, setMoving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOrder, setDragOrder] = useState<Routine[] | null>(null);
  const dragOffset = useRef(new Animated.Value(0)).current;
  const routineLayouts = useRef<Record<string, { y: number; height: number }>>({});
  const dragOrderRef = useRef<Routine[]>([]);
  const dragStartTop = useRef(0);
  const dragVisualTop = useRef(0);
  const dragHeight = useRef(0);
  const dragLayoutPending = useRef(false);
  const displayedRoutines = dragOrder ?? routines;

  const handleDragStart = (id: string) => {
    const order = [...routines];
    const layout = routineLayouts.current[id];
    dragOrderRef.current = order;
    setDragOrder(order);
    dragStartTop.current = layout?.y ?? 0;
    dragVisualTop.current = dragStartTop.current;
    dragHeight.current = layout?.height ?? 0;
    dragLayoutPending.current = false;
    dragOffset.setValue(0);
    setDraggingId(id);
  };

  const handleDragMove = (id: string, offset: number) => {
    dragVisualTop.current = dragStartTop.current + offset;
    const currentLayout = routineLayouts.current[id];
    if (currentLayout) dragOffset.setValue(dragVisualTop.current - currentLayout.y);
    if (dragLayoutPending.current) return;

    const order = dragOrderRef.current;
    const fromIndex = order.findIndex(item => item.id === id);
    const slot = routineLayouts.current[id];
    if (fromIndex < 0 || !slot) return;
    const visualCenter = dragVisualTop.current + (dragHeight.current || slot.height) / 2;
    const slotCenter = slot.y + slot.height / 2;
    let toIndex = fromIndex;

    if (visualCenter > slotCenter && fromIndex < order.length - 1) {
      const nextLayout = routineLayouts.current[order[fromIndex + 1].id];
      if (nextLayout && visualCenter > (slotCenter + nextLayout.y + nextLayout.height / 2) / 2) {
        toIndex = fromIndex + 1;
      }
    } else if (visualCenter < slotCenter && fromIndex > 0) {
      const previousLayout = routineLayouts.current[order[fromIndex - 1].id];
      if (previousLayout && visualCenter < (slotCenter + previousLayout.y + previousLayout.height / 2) / 2) {
        toIndex = fromIndex - 1;
      }
    }

    if (toIndex === fromIndex) return;
    dragLayoutPending.current = true;
    const nextOrder = [...order];
    const [movedRoutine] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, movedRoutine);
    dragOrderRef.current = nextOrder;
    setDragOrder(nextOrder);
  };

  const handleDragCancel = () => {
    dragOffset.setValue(0);
    dragLayoutPending.current = false;
    setDraggingId(null);
    setDragOrder(null);
  };

  const handleDragEnd = async (id: string, startPointerY: number, pointerY: number) => {
    handleDragMove(id, pointerY - startPointerY);
    const next = dragOrderRef.current.map(item => item.id);
    const changed = next.some((routineId, index) => routineId !== routines[index]?.id);
    dragOffset.setValue(0);
    dragLayoutPending.current = false;
    setDraggingId(null);
    if (!changed || moving) {
      setDragOrder(null);
      return;
    }
    setMoving(true);
    try {
      await reorderRoutines(next);
    } catch (error) {
      Alert.alert('No se pudo cambiar el orden', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setMoving(false);
      setDragOrder(null);
    }
  };

  const confirmDelete = (routine: Routine) => Alert.alert(
    'Eliminar rutina',
    `La rutina "${routine.name}" dejará de aparecer en tu secuencia. Tus entrenamientos guardados se conservarán.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void deleteRoutine(routine.id).catch(error => {
            Alert.alert('No se pudo eliminar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
          });
        },
      },
    ],
  );

  return (
    <Screen>
      <AppScrollView>
        <Header title="Entreno" subtitle="Tu secuencia, en el orden que tú decidas." />
        {active ? <ActionButton label={`Continuar · ${active.routine.name}`} icon="arrow-forward" onPress={() => navigation.navigate('ActiveExercise')} /> : null}
        <ActionButton label="Entrenamiento rápido" icon="flash" variant="outline" onPress={() => navigation.navigate('QuickWorkout')} />
        <ActionButton label="Registrar lo que hice" icon="add-circle-outline" variant="outline" onPress={() => navigation.navigate('LogPastWorkout', { daysAgo: 0 })} />

        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Secuencia activa</Text>
            <Text style={styles.sectionSubtitle}>{routines.length} bloques · mantén pulsado para ordenar</Text>
          </View>
          <Pressable style={styles.headerAction} onPress={() => navigation.navigate('RoutineEditor')}>
            <Ionicons name="add" size={17} color={colors.primary} />
            <Text style={styles.headerActionText}>Crear</Text>
          </Pressable>
        </View>

        {routines.length > 1 ? (
          <View style={styles.orderHint}>
            <Ionicons name="hand-left-outline" size={18} color={colors.primary} />
            <Text style={styles.orderHintText}>Mantén pulsada una rutina, arrástrala y suéltala en su nueva posición.</Text>
          </View>
        ) : null}

        {!routines.length ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Ionicons name="albums-outline" size={29} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>Crea tu primera rutina</Text>
            <Text style={styles.emptyBody}>Elige tus ejercicios, ordénalos y define series, repeticiones y descansos.</Text>
            <ActionButton label="Crear rutina" icon="add" onPress={() => navigation.navigate('RoutineEditor')} />
          </Card>
        ) : null}

        {displayedRoutines.map((routine, index) => (
          <Animated.View
            key={routine.id}
            onLayout={event => {
              const nextLayout = {
                y: event.nativeEvent.layout.y,
                height: event.nativeEvent.layout.height,
              };
              routineLayouts.current[routine.id] = nextLayout;
              if (draggingId === routine.id) {
                dragLayoutPending.current = false;
                dragOffset.setValue(dragVisualTop.current - nextLayout.y);
              }
            }}
            style={[
              draggingId === routine.id && styles.draggingCard,
              draggingId === routine.id && { transform: [{ translateY: dragOffset }, { scale: 1.015 }] },
            ]}
          >
            <Card style={[styles.routineCard, draggingId === routine.id && styles.routineCardDragging]} delay={index * 45}>
              <LongPressDragArea
                accessibilityLabel={`${routine.name}. Toca para abrir o mantén pulsado y arrastra para cambiar su posición.`}
                dragDisabled={moving}
                style={styles.routineTop}
                onTap={() => {
                  routine.isRest
                    ? navigation.navigate('RoutineEditor', { routineId: routine.id })
                    : navigation.navigate('RoutineDetail', { routineId: routine.id });
                }}
                onDragStart={() => handleDragStart(routine.id)}
                onDragMove={offset => handleDragMove(routine.id, offset)}
                onDragEnd={(startPointerY, pointerY) => {
                  void handleDragEnd(routine.id, startPointerY, pointerY);
                }}
                onDragCancel={handleDragCancel}
              >
                <View style={[styles.order, routine.isRest && styles.orderRest]}>
                  <Text style={styles.orderText}>{index + 1}</Text>
                </View>
                {routine.exercises[0] ? (
                  <ExerciseMedia mediaKey={routine.exercises[0].mediaKey} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.restThumb]}><Ionicons name="moon" size={28} color={colors.textDim} /></View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <Text style={styles.meta}>
                    {routine.isRest
                      ? 'Recuperación programada'
                      : `${routine.exercises.length} ejercicios · ${routine.exercises.reduce((sum, item) => sum + item.sets, 0)} series`}
                  </Text>
                  {!routine.isRest && routine.muscles.length ? (
                    <Text style={styles.muscles} numberOfLines={1}>{routine.muscles.join(' · ')}</Text>
                  ) : null}
                </View>
                <View style={[styles.dragAffordance, draggingId === routine.id && styles.dragAffordanceActive]}>
                  <Ionicons name="reorder-three" size={24} color={draggingId === routine.id ? colors.primary : colors.textDim} />
                </View>
              </LongPressDragArea>

              <View style={styles.cardActions}>
                <Pressable style={styles.cardAction} onPress={() => navigation.navigate('RoutineEditor', { routineId: routine.id })}>
                  <Ionicons name="create-outline" size={17} color={colors.primary} />
                  <Text style={styles.editText}>Editar</Text>
                </Pressable>
                <Pressable style={styles.cardAction} onPress={() => confirmDelete(routine)}>
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                  <Text style={styles.deleteText}>Eliminar</Text>
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        ))}
      </AppScrollView>
    </Screen>
  );
}

const useStyles = createThemedStyleSheet(colors => ({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  sectionSubtitle: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  headerAction: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  headerActionText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  orderHint: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primaryBorder, backgroundColor: colors.primarySoftBackground },
  orderHintText: { color: colors.textMuted, flex: 1, fontSize: 11, lineHeight: 16 },
  emptyCard: { alignItems: 'stretch', paddingVertical: spacing.xxl },
  emptyIcon: { width: 58, height: 58, borderRadius: 19, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  emptyTitle: { color: colors.text, fontSize: 19, fontWeight: '900', textAlign: 'center', marginTop: spacing.md },
  emptyBody: { color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: spacing.xs, marginBottom: spacing.lg },
  routineCard: { padding: spacing.md },
  routineCardDragging: { borderColor: colors.primary },
  draggingCard: { zIndex: 20, elevation: 10, shadowColor: colors.primary, shadowOpacity: 0.24, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  routineTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  order: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  orderRest: { backgroundColor: colors.surfaceMuted },
  orderText: { color: colors.black, fontWeight: '900', fontSize: 16 },
  thumb: { width: 76, height: 56 },
  restThumb: { backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  routineName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  muscles: { color: colors.primary, fontSize: 9, fontWeight: '700', marginTop: 4 },
  dragAffordance: { width: 38, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dragAffordanceActive: { backgroundColor: colors.primarySoftBackground, borderWidth: 1, borderColor: colors.primaryBorder },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: spacing.sm },
  cardAction: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm },
  editText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  deleteText: { color: colors.danger, fontWeight: '700', fontSize: 12 },
}));
