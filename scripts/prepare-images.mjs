import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
const [heroSource, panelSource, promptsSource] = process.argv.slice(2);
if (!heroSource || !panelSource) {
  console.error('Uso: node scripts/prepare-images.mjs ruta-hero.png ruta-panel.png [ruta-prompts.md]');
  process.exit(1);
}
await mkdir('public/images', { recursive: true });
await mkdir('docs', { recursive: true });
await Promise.all([
  sharp(heroSource).resize({width:1920}).webp({quality:83}).toFile('public/images/hero-solar.webp'),
  sharp(heroSource).resize({width:960}).webp({quality:80}).toFile('public/images/hero-mobile.webp'),
  sharp(panelSource).resize({width:1600}).webp({quality:82}).toFile('public/images/panel-detail.webp'),
  promptsSource ? copyFile(promptsSource,'docs/IMAGE-PROMPTS.md') : Promise.resolve()
]);
console.log('Imágenes originales optimizadas e integradas.');
