export type ChangelogEntry = {
  version: number;
  date: string;
  title: string;
  summary: string;
  newExerciseKeys?: string[];
};

// `version` es un contador propio de esta pantalla, no la versión de la app
// (app.json). Súbelo de a uno cada vez que agregues una entrada nueva.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: 1,
    date: '24 de julio',
    title: 'Bienvenida, historial editable y ayuda',
    summary: 'La app ahora te pregunta quién sos al abrirla por primera vez. Podés editar o borrar entrenamientos, comidas y pesos que ya cargaste, registrar un entrenamiento de días atrás, y hay una nueva sección de ayuda para entender los conceptos menos obvios.',
  },
  {
    version: 2,
    date: '25 de julio',
    title: '12 ejercicios y 2 grupos musculares nuevos',
    summary: 'Sumamos Antebrazos y Trapecios como grupos nuevos, y más variedad en Glúteos, Pantorrillas, Abdomen, Bíceps, Tríceps y Hombros.',
    newExerciseKeys: [
      'gripper-hands', 'wrist-curl', 'cable-shrug', 'cable-pull-through',
      'donkey-calf-raise', 'standing-crunch', 'cable-twist', 'cable-curl',
      'concentration-curl', 'overhead-triceps-extension', 'triceps-kickback', 'front-raise',
    ],
  },
  {
    version: 3,
    date: '25 de julio',
    title: 'Racha real en "Rutina de hoy"',
    summary: 'El número de racha junto al ícono de fuego ahora se calcula de verdad a partir de tu historial (antes era un valor fijo que no reflejaba nada) — cuenta los días seguidos que completaste tu plan, incluidos los de descanso.',
  },
  {
    version: 4,
    date: '25 de julio',
    title: 'Nuevo estilo visual: Bento claro',
    summary: 'Desde Perfil → Estilo visual podés cambiar entre el look oscuro original y un estilo Bento claro (tarjetas blancas, fondo claro, tipo dashboard) — independiente del acento de color que ya elegías.',
  },
];

export const LATEST_CHANGELOG_VERSION = CHANGELOG.reduce((max, item) => Math.max(max, item.version), 0);
