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
  {
    version: 5,
    date: '25 de julio',
    title: 'Nuevo estilo visual: Vidrio',
    summary: 'Un tercer estilo, ahora con vidrio esmerilado real (no solo colores translúcidos): tarjetas, la barra inferior y las ayudas contextuales desenfocan de verdad lo que hay detrás, con destellos de color ambientales. Elegilo desde Perfil → Estilo visual.',
  },
  {
    version: 6,
    date: '29 de julio',
    title: 'Rutinas y registro mucho más flexibles',
    summary: 'Ahora podés ordenar, editar o eliminar rutinas con mayor claridad, buscar ejercicios por grupo muscular y configurar sus objetivos con controles más cómodos. El registro pasado también puede empezar vacío: agregás solo los ejercicios y series que realmente hiciste. Las animaciones suman un velo de luz sutil y dinámico.',
  },
  {
    version: 7,
    date: '29 de julio',
    title: '40 ejercicios nuevos de máquinas y poleas',
    summary: 'El catálogo creció con 40 ejercicios adicionales del manifiesto de máquinas y poleas: dominadas asistidas, variantes de press, remos, curls, extensiones, trabajo de hombros, pecho, espalda, piernas y abdomen. Todos incluyen animación y miniatura propias.',
  },
];

export const LATEST_CHANGELOG_VERSION = CHANGELOG.reduce((max, item) => Math.max(max, item.version), 0);
