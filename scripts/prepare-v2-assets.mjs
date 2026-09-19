import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
const source = process.argv[2];
if (!source) throw new Error('Indica la carpeta de originales generados.');
const assets = {
  'hero-sky': 'exec-635aeb47-48a1-4e73-a612-d0b7cb5d16b3.png',
  'hero-house': 'exec-7cc80591-396a-469c-9bca-daa2ddaed66f.png',
  'hero-plants': 'exec-be88fe3e-a7fa-4199-bfa7-35e582fb7081.png',
  'solution-business': 'exec-c9fbc589-61b9-4bb3-9f14-9e632e2652ee.png',
  'solution-mobility': 'exec-858658d5-2587-4ff5-a4e3-9373d18d7fbe.png',
};
await mkdir('public/images', { recursive: true });
for (const [name, file] of Object.entries(assets)) {
  const alpha = ['hero-house','hero-plants'].includes(name);
  await sharp(`${source}/${file}`).resize({width:1672,withoutEnlargement:true}).webp({quality:84,alphaQuality:100}).toFile(`public/images/${name}.webp`);
  if (name.startsWith('hero-')) await sharp(`${source}/${file}`).resize({width:960}).webp({quality:80,alphaQuality:alpha?100:80}).toFile(`public/images/${name}-mobile.webp`);
}
await copyFile(`${source}/helio-v2-image-manifest.json`,'docs/IMAGE-PROMPTS-V2.json');
console.log('5 imágenes integradas, 3 variantes móviles y alpha preservado.');
