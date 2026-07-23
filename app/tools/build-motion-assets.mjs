import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(toolDir, '..');
const repoDir = path.resolve(appDir, '..');
const outputDir = path.join(appDir, 'assets', 'motion');

const sheets = [
  {
    file: path.join(repoDir, 'mobile', 'assets', 'exercise_motion', 'source', 'pull_sheet.png'),
    exercises: ['lat-pulldown', 'barbell-row', 'seated-row', 'barbell-curl'],
  },
  {
    file: path.join(repoDir, 'mobile', 'assets', 'exercise_motion', 'source', 'push_legs_sheet.png'),
    exercises: ['bench-press', 'back-squat', 'overhead-press', 'lateral-raise'],
  },
  {
    file: path.join(repoDir, 'mobile', 'assets', 'exercise_motion', 'source', 'accessory_sheet.png'),
    exercises: ['triceps-pushdown', 'leg-press', 'romanian-deadlift', 'hammer-curl'],
  },
];

await fs.mkdir(outputDir, { recursive: true });

for (const sheet of sheets) {
  const metadata = await sharp(sheet.file).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`No se pudo leer ${sheet.file}`);
  }

  const frameWidth = Math.floor(metadata.width / 4);
  const frameHeight = Math.floor(metadata.height / 4);

  for (let row = 0; row < sheet.exercises.length; row += 1) {
    const name = sheet.exercises[row];
    const frames = [];

    for (let column = 0; column < 4; column += 1) {
      frames.push(
        await sharp(sheet.file)
          .extract({
            left: column * frameWidth,
            top: row * frameHeight,
            width: frameWidth,
            height: frameHeight,
          })
          .resize(384, 384, { fit: 'cover' })
          .webp({ quality: 82, preset: 'photo', effort: 5 })
          .toBuffer(),
      );
    }

    const pingPong = [frames[0], frames[1], frames[2], frames[3], frames[2], frames[1]];
    await sharp(pingPong, { join: { animated: true } })
      .webp({
        quality: 80,
        preset: 'photo',
        effort: 5,
        loop: 0,
        delay: [360, 300, 300, 420, 300, 300],
      })
      .toFile(path.join(outputDir, `${name}.webp`));

    await sharp(frames[0])
      .resize(256, 176, { fit: 'cover' })
      .webp({ quality: 78, preset: 'photo', effort: 5 })
      .toFile(path.join(outputDir, `${name}-thumb.webp`));
  }
}

console.log(`Generadas ${sheets.length * 4} animaciones y miniaturas en ${outputDir}`);
