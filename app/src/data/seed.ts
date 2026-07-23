import type { Exercise, Profile, Routine } from '../types';

export const DEFAULT_PROFILE: Profile = {
  name: 'Jesús',
  goal: 'Ganar fuerza y masa muscular',
  experience: 'Intermedio',
  availableDays: 4,
  durationMinutes: 70,
  unit: 'kg',
  theme: 'Oscuro',
  calorieTarget: 2300,
  proteinTarget: 180,
};

export const SEED_EXERCISES: Exercise[] = [
  {
    id: 'lat-pulldown',
    name: 'Jalón al pecho',
    muscle: 'Espalda',
    mediaKey: 'lat-pulldown',
    instructions: ['Agarra la barra algo más ancho que los hombros.', 'Lleva los codos hacia abajo sin balancearte.', 'Controla el regreso hasta extender los brazos.'],
  },
  {
    id: 'barbell-row',
    name: 'Remo con barra',
    muscle: 'Espalda',
    mediaKey: 'barbell-row',
    instructions: ['Inclina el torso manteniendo la espalda neutra.', 'Lleva la barra hacia la parte baja del abdomen.', 'Evita encoger los hombros.'],
  },
  {
    id: 'seated-row',
    name: 'Remo sentado',
    muscle: 'Espalda',
    mediaKey: 'seated-row',
    instructions: ['Mantén el pecho elevado.', 'Tira del agarre hacia el ombligo.', 'Regresa sin perder la postura.'],
  },
  {
    id: 'barbell-curl',
    name: 'Curl con barra',
    muscle: 'Bíceps',
    mediaKey: 'barbell-curl',
    instructions: ['Fija los codos junto al torso.', 'Sube la barra sin impulsar la cadera.', 'Baja de forma controlada.'],
  },
  {
    id: 'hammer-curl',
    name: 'Curl martillo',
    muscle: 'Bíceps',
    mediaKey: 'hammer-curl',
    instructions: ['Usa un agarre neutro.', 'Mantén el brazo quieto.', 'Aprieta arriba sin flexionar la muñeca.'],
  },
  {
    id: 'bench-press',
    name: 'Press de banca',
    muscle: 'Pecho',
    mediaKey: 'bench-press',
    instructions: ['Apoya firmemente pies y espalda.', 'Baja la barra al centro del pecho.', 'Empuja conservando las muñecas rectas.'],
  },
  {
    id: 'triceps-pushdown',
    name: 'Extensión de tríceps',
    muscle: 'Tríceps',
    mediaKey: 'triceps-pushdown',
    instructions: ['Mantén los codos pegados al torso.', 'Extiende por completo sin inclinarte.', 'Controla la subida.'],
  },
  {
    id: 'back-squat',
    name: 'Sentadilla con barra',
    muscle: 'Piernas',
    mediaKey: 'back-squat',
    instructions: ['Mantén el abdomen firme.', 'Desciende con rodillas alineadas a los pies.', 'Sube empujando el suelo.'],
  },
  {
    id: 'leg-press',
    name: 'Prensa de piernas',
    muscle: 'Piernas',
    mediaKey: 'leg-press',
    instructions: ['Apoya toda la espalda.', 'Baja sin despegar la cadera.', 'No bloquees las rodillas al extender.'],
  },
  {
    id: 'romanian-deadlift',
    name: 'Peso muerto rumano',
    muscle: 'Piernas',
    mediaKey: 'romanian-deadlift',
    instructions: ['Lleva la cadera hacia atrás.', 'Mantén la barra cerca de las piernas.', 'Sube contrayendo glúteos.'],
  },
  {
    id: 'overhead-press',
    name: 'Press militar',
    muscle: 'Hombros',
    mediaKey: 'overhead-press',
    instructions: ['Aprieta abdomen y glúteos.', 'Empuja en línea vertical.', 'Termina con los brazos sobre la cabeza.'],
  },
  {
    id: 'lateral-raise',
    name: 'Elevaciones laterales',
    muscle: 'Hombros',
    mediaKey: 'lateral-raise',
    instructions: ['Mantén una ligera flexión de codo.', 'Sube hasta la altura del hombro.', 'Evita usar impulso.'],
  },
];

const exercise = (id: string) => {
  const found = SEED_EXERCISES.find(item => item.id === id);
  if (!found) throw new Error(`Ejercicio semilla inexistente: ${id}`);
  return found;
};

const planned = (
  routineId: string,
  position: number,
  id: string,
  sets: number,
  repMin: number,
  repMax: number,
  restSeconds: number,
) => ({
  ...exercise(id),
  routineId,
  position,
  sets,
  repMin,
  repMax,
  restSeconds,
  lastWeight: null,
});

export const SEED_ROUTINES: Routine[] = [
  {
    id: 'back-biceps',
    name: 'Espalda + Bíceps',
    orderIndex: 0,
    muscles: ['Espalda', 'Bíceps'],
    isRest: false,
    active: true,
    exercises: [
      planned('back-biceps', 0, 'lat-pulldown', 4, 8, 12, 90),
      planned('back-biceps', 1, 'barbell-row', 4, 8, 12, 90),
      planned('back-biceps', 2, 'seated-row', 3, 10, 12, 75),
      planned('back-biceps', 3, 'barbell-curl', 3, 10, 12, 60),
      planned('back-biceps', 4, 'hammer-curl', 3, 10, 12, 60),
    ],
  },
  {
    id: 'legs',
    name: 'Pierna',
    orderIndex: 1,
    muscles: ['Piernas'],
    isRest: false,
    active: true,
    exercises: [
      planned('legs', 0, 'back-squat', 4, 6, 10, 120),
      planned('legs', 1, 'leg-press', 4, 10, 12, 90),
      planned('legs', 2, 'romanian-deadlift', 3, 8, 12, 90),
    ],
  },
  {
    id: 'chest-triceps',
    name: 'Pecho + Tríceps',
    orderIndex: 2,
    muscles: ['Pecho', 'Tríceps'],
    isRest: false,
    active: true,
    exercises: [
      planned('chest-triceps', 0, 'bench-press', 4, 8, 12, 90),
      planned('chest-triceps', 1, 'overhead-press', 3, 8, 10, 90),
      planned('chest-triceps', 2, 'triceps-pushdown', 3, 10, 15, 60),
    ],
  },
  {
    id: 'shoulders',
    name: 'Hombros',
    orderIndex: 3,
    muscles: ['Hombros'],
    isRest: false,
    active: true,
    exercises: [
      planned('shoulders', 0, 'overhead-press', 4, 6, 10, 90),
      planned('shoulders', 1, 'lateral-raise', 4, 12, 15, 60),
      planned('shoulders', 2, 'seated-row', 3, 12, 15, 60),
    ],
  },
  {
    id: 'rest',
    name: 'Descanso',
    orderIndex: 4,
    muscles: ['Descanso'],
    isRest: true,
    active: true,
    exercises: [],
  },
];
