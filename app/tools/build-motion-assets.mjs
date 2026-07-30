import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(toolDir, '..');
const sourceDir = path.join(appDir, 'assets', 'exercise_motion', 'source', 'ejercicios_organizados');
const machineDatasetDir = path.join(appDir, 'assets', 'exercise_motion', 'source', 'exercises-machine-men-first-200-512', 'videos');
const outputDir = path.join(appDir, 'assets', 'motion');

// Cada entrada convierte un gif animado (estilo diagrama anatómico,
// organizado por el usuario en ejercicios_organizados/<grupo>/<archivo>) al
// mismo formato webp que usa el resto del catálogo. Estos gifs ya traen sus
// propios frames y timing reales — no hay que rebanar grid ni sintetizar
// ping-pong.
const clips = [
  // Ejercicios nuevos (grupos que antes no existían).
  { file: 'hombros/vuelo-posterior-polea-variante-a.gif', id: 'rear-delt-fly' },
  { file: 'cuadriceps/extension-cuadriceps-maquina.gif', id: 'leg-extension' },
  { file: 'pecho/press-inclinado-pecho-maquina.gif', id: 'incline-bench-press' },
  { file: 'pecho/aperturas-pecho-maquina.gif', id: 'pec-deck-fly' },
  { file: 'pecho/aperturas-mancuernas.gif', id: 'dumbbell-fly' },
  { file: 'triceps/fondos-inversos-en-suelo.gif', id: 'bench-dips' },
  { file: 'isquiotibiales/curl-femoral-tumbado-maquina.gif', id: 'femoral-echado' },
  { file: 'aductores-cadera/aduccion-cadera-maquina.gif', id: 'hip-adductor' },
  { file: 'abductores-cadera/abduccion-cadera-maquina.gif', id: 'hip-abductor' },
  { file: 'pantorrillas/elevacion-talones-maquina.gif', id: 'calf-raise' },
  { file: 'gluteos/hip-thrust-barra.gif', id: 'hip-thrust' },
  { file: 'abdomen/abdominales-silla-romana.gif', id: 'roman-chair-situp' },
  // Migración de los 12 originales al mismo estilo diagrama (coincidencia
  // exacta de ejercicio en la carpeta del usuario). Sobrescriben el webp
  // fotorrealista viejo conservando el mismo mediaKey.
  { file: 'espalda/jalon-dorsal-maquina-agarre-supino.gif', id: 'lat-pulldown' },
  { file: 'espalda/remo-sentado-polea-barra-v.gif', id: 'seated-row' },
  { file: 'pecho/press-banca-barra.gif', id: 'bench-press' },
  { file: 'triceps/jalon-triceps-polea-barra-v.gif', id: 'triceps-pushdown' },
  { file: 'cuadriceps/prensa-piernas-45-grados-pies-anchos.gif', id: 'leg-press' },
  { file: 'biceps/curl-predicador-barra.gif', id: 'barbell-curl' },
  { file: 'biceps/curl-martillo-cruzado-mancuerna.gif', id: 'hammer-curl' },
  { file: 'hombros/press-militar-de-pie-mancuernas.gif', id: 'overhead-press' },
  { file: 'hombros/elevaciones-laterales-mancuernas.gif', id: 'lateral-raise' },
  { file: 'isquiotibiales/peso-muerto-rumano-barra.gif', id: 'romanian-deadlift' },
  { file: 'cuadriceps/sentadilla-barra.gif', id: 'back-squat' },
  // barbell-row: sin gif de remo con barra en la carpeta; se usa remo bajo en
  // polea y el nombre en seed.ts refleja eso. Cambiar si llega el de barra.
  { file: 'espalda/remo-bajo-sentado-polea.gif', id: 'barbell-row' },
  // Selección inicial del dataset de 200 ejercicios de máquina/cable.
  { file: 'antebrazos/prensa-de-mano.gif', id: 'gripper-hands' },
  { file: 'antebrazos/curl-muneca-polea.gif', id: 'wrist-curl' },
  { file: 'trapecios/encogimiento-polea.gif', id: 'cable-shrug' },
  { file: 'gluteos/pull-through-polea.gif', id: 'cable-pull-through' },
  { file: 'pantorrillas/elevacion-talones-inclinado.gif', id: 'donkey-calf-raise' },
  { file: 'abdomen/crunch-de-pie-polea.gif', id: 'standing-crunch' },
  { file: 'abdomen/giro-torso-polea.gif', id: 'cable-twist' },
  { file: 'biceps/curl-polea.gif', id: 'cable-curl' },
  { file: 'biceps/curl-concentracion-polea.gif', id: 'concentration-curl' },
  { file: 'triceps/extension-polea-arriba.gif', id: 'overhead-triceps-extension' },
  { file: 'triceps/patada-triceps-polea.gif', id: 'triceps-kickback' },
  { file: 'hombros/elevacion-frontal-polea.gif', id: 'front-raise' },
];

const additionalMachineIds = [
  '0007', '0009', '0015', '0017', '1431', '1432', '0019', '2364', '0148', '0149',
  '3235', '0150', '0151', '1630', '1631', '0152', '0153', '0154', '0155', '0868',
  '0157', '0158', '1260', '1261', '0159', '1632', '0160', '0161', '0162', '0164',
  '0165', '1722', '0167', '0168', '0169', '1318', '0171', '0170', '0172', '0173',
];
const manifest = await fs.readFile(path.join(machineDatasetDir, '..', 'data', 'manifest-first-200.csv'), 'utf8');
const manifestRows = new Map(manifest.trim().split(/\r?\n/).slice(1).map(line => {
  const columns = line.split(',');
  return [columns[1], columns[7]];
}));
const additionalClips = additionalMachineIds.map(id => {
  const file = manifestRows.get(id);
  if (!file) throw new Error(`No se encontró el GIF del ejercicio ${id} en el manifiesto.`);
  return { file, id: `machine-${id}`, sourceDir: machineDatasetDir };
});

await fs.mkdir(outputDir, { recursive: true });

for (const clip of [...clips, ...additionalClips]) {
  const sourceFile = path.join(clip.sourceDir ?? sourceDir, clip.file);
  const metadata = await sharp(sourceFile, { animated: true }).metadata();
  if (!metadata.width || !metadata.pageHeight || !metadata.pages) {
    throw new Error(`No se pudo leer ${sourceFile}`);
  }

  const frames = [];
  for (let page = 0; page < metadata.pages; page += 1) {
    frames.push(
      await sharp(sourceFile, { page })
        .resize(384, 384, { fit: 'cover' })
        .webp({ quality: 82, preset: 'photo', effort: 5 })
        .toBuffer(),
    );
  }

  const delay = Array.isArray(metadata.delay) && metadata.delay.length === frames.length
    ? metadata.delay
    : frames.map(() => 100);

  await sharp(frames, { join: { animated: true } })
    .webp({ quality: 80, preset: 'photo', effort: 5, loop: 0, delay })
    .toFile(path.join(outputDir, `${clip.id}.webp`));

  await sharp(frames[0])
    .resize(256, 176, { fit: 'cover' })
    .webp({ quality: 78, preset: 'photo', effort: 5 })
    .toFile(path.join(outputDir, `${clip.id}-thumb.webp`));
}

console.log(`Generadas ${clips.length + additionalClips.length} animaciones y miniaturas en ${outputDir}`);
