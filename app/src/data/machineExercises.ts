import type { Exercise, MuscleGroup } from '../types';

const defaultInstructions = [
  'Ajusta la máquina y adopta una postura estable.',
  'Realiza el movimiento con control, sin balancear el cuerpo.',
  'Regresa lentamente a la posición inicial y repite.',
];

const machine = (id: string, name: string, muscle: MuscleGroup): Exercise => ({
  id: `machine-${id}`,
  name,
  muscle,
  mediaKey: `machine-${id}`,
  instructions: defaultInstructions,
});

// Selección inicial de 40 ejercicios del manifiesto first-200. Los nombres y
// grupos se traducen aquí para que el catálogo siga siendo claro en español;
// sus GIF originales se convierten desde build-motion-assets.mjs.
export const MACHINE_EXERCISES: Exercise[] = [
  machine('0007', 'Jalón lateral alterno', 'Espalda'),
  machine('0009', 'Fondos asistidos de pecho (arrodillado)', 'Pecho'),
  machine('0015', 'Dominadas asistidas con agarre cerrado', 'Espalda'),
  machine('0017', 'Dominadas asistidas', 'Espalda'),
  machine('1431', 'Dominada supina asistida de pie', 'Espalda'),
  machine('1432', 'Dominada asistida de pie', 'Espalda'),
  machine('0019', 'Fondos asistidos de tríceps (arrodillado)', 'Tríceps'),
  machine('2364', 'Fondos asistidos de pecho con agarre ancho', 'Pecho'),
  machine('0148', 'Press alterno de hombro en polea', 'Hombros'),
  machine('0149', 'Extensión alterna de tríceps en polea', 'Tríceps'),
  machine('3235', 'Curl inverso de pierna asistido en polea', 'Piernas'),
  machine('0150', 'Jalón lateral con barra en polea', 'Espalda'),
  machine('0151', 'Press de pecho en polea', 'Pecho'),
  machine('1630', 'Curl cerrado en polea', 'Bíceps'),
  machine('1631', 'Curl concentrado en polea', 'Bíceps'),
  machine('0152', 'Extensión de tríceps en polea sobre la rodilla', 'Tríceps'),
  machine('0153', 'Jalón lateral cruzado en polea', 'Espalda'),
  machine('0154', 'Vuelo posterior cruzado en polea', 'Hombros'),
  machine('0155', 'Cruce de polea para pecho (variante)', 'Pecho'),
  machine('0868', 'Curl de bíceps en polea (variante)', 'Bíceps'),
  machine('0157', 'Peso muerto en polea', 'Glúteos'),
  machine('0158', 'Aperturas declinadas en polea', 'Pecho'),
  machine('1260', 'Press declinado unilateral en polea', 'Pecho'),
  machine('1261', 'Press declinado en polea', 'Pecho'),
  machine('0159', 'Remo sentado amplio en polea', 'Espalda'),
  machine('1632', 'Curl de arrastre en polea', 'Bíceps'),
  machine('0160', 'Remo sentado amplio en el suelo', 'Espalda'),
  machine('0161', 'Elevación frontal hacia delante en polea', 'Hombros'),
  machine('0162', 'Elevación frontal en polea (variante)', 'Hombros'),
  machine('0164', 'Elevación frontal de hombro en polea', 'Hombros'),
  machine('0165', 'Curl martillo con cuerda en polea', 'Bíceps'),
  machine('1722', 'Extensión de tríceps sobre la cabeza en polea alta', 'Tríceps'),
  machine('0167', 'Remo alto arrodillado en polea', 'Espalda'),
  machine('0168', 'Aducción de cadera en polea', 'Piernas'),
  machine('0169', 'Press inclinado de pecho en polea', 'Pecho'),
  machine('1318', 'Remo inclinado en polea', 'Espalda'),
  machine('0171', 'Aperturas inclinadas en polea', 'Pecho'),
  machine('0170', 'Aperturas inclinadas en polea sobre balón', 'Pecho'),
  machine('0172', 'Jalón inclinado en polea', 'Espalda'),
  machine('0173', 'Extensión inclinada de tríceps en polea', 'Tríceps'),
];
